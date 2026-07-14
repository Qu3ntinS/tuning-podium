import { useStorage } from "@vueuse/core";
import { onMounted, onUnmounted } from "vue";

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  return audioContext;
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;

  const interactive = target.closest(
    [
      "button:not(:disabled)",
      "a[href]",
      '[role="button"]:not([aria-disabled="true"])',
      "label[for]",
      ".soft-row-interactive",
      "[data-sound='click']",
    ].join(", "),
  );

  if (!interactive) return false;
  if (interactive.closest("[data-sound='off']")) return false;
  return true;
}

function scheduleGainEnvelope(
  gain: GainNode,
  startTime: number,
  peak: number,
  attackMs: number,
  releaseMs: number,
) {
  const attack = attackMs / 1000;
  const release = releaseMs / 1000;

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peak, startTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + release);
}

function playToneClick(ctx: AudioContext, startTime: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(920, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(520, startTime + 0.028);

  scheduleGainEnvelope(gain, startTime, 0.028, 1.5, 30);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + 0.04);
}

function playNoiseTap(ctx: AudioContext, startTime: number) {
  const duration = 0.018;
  const sampleCount = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const samples = buffer.getChannelData(0);

  for (let i = 0; i < sampleCount; i += 1) {
    const decay = 1 - i / sampleCount;
    samples[i] = (Math.random() * 2 - 1) * decay * decay;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2400;
  filter.Q.value = 0.9;

  const gain = ctx.createGain();
  scheduleGainEnvelope(gain, startTime, 0.018, 0.4, 16);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start(startTime);
  source.stop(startTime + duration);
}

export function useSounds() {
  const soundsEnabled = useStorage("podium-sounds", true);

  function playClick() {
    if (!soundsEnabled.value) return;

    try {
      const ctx = getAudioContext();
      const startTime = ctx.currentTime;

      playNoiseTap(ctx, startTime);
      playToneClick(ctx, startTime + 0.001);
    } catch {
      void 0;
    }
  }

  return {
    soundsEnabled,
    playClick,
  };
}

export function useClickSounds() {
  const { playClick, soundsEnabled } = useSounds();

  const handleClick = (event: MouseEvent) => {
    if (!soundsEnabled.value || !isInteractiveTarget(event.target)) return;
    playClick();
  };

  onMounted(() => {
    document.addEventListener("click", handleClick, { capture: true, passive: true });
  });

  onUnmounted(() => {
    document.removeEventListener("click", handleClick, { capture: true });
  });
}
