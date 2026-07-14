import { registerSW } from "virtual:pwa-register";
import { createApp } from "vue";
import { router } from "@/router";
import App from "./App.vue";
import "vue-sonner/style.css";
import "./style.css";

registerSW({ immediate: true });

createApp(App).use(router).mount("#app");
