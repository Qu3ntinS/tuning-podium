# Tuning Podium

Web-App für Abstimmungen auf Tuningtreffen: ein Event-QR-Code, Besucher wählen Top 3 (5/3/1 Punkte), Organizer verwalten Fahrzeuge und sehen das Live-Leaderboard.

**Stack:** Bun · Elysia · Prisma · PostgreSQL · Vue 3 · Vite · Tailwind · shadcn-vue · PWA

## Voraussetzungen

- [Bun](https://bun.sh) ≥ 1.2
- [Docker](https://docs.docker.com/get-docker/) (für PostgreSQL lokal)

## Setup

```bash
git clone <repo-url> tuning-podium
cd tuning-podium

cp .env.example .env
# JWT_SECRET anpassen (min. 32 Zeichen), optional ADMIN_EMAIL / ADMIN_PASSWORD

bun install
bun run db:up
bun run db:migrate
bun run --filter @tuning-podium/api db:seed
```

`.env` liegt im Repo-Root. Die API liest sie über `apps/api/.env` (Symlink oder Kopie).

## Entwicklung

```bash
# Terminal 1 — API (Port 3001)
bun run dev:api

# Terminal 2 — Frontend (Port 5173)
bun run dev:web
```

| URL | Beschreibung |
|-----|--------------|
| http://localhost:5173/vote | Abstimmung |
| http://localhost:5173/leaderboard | Live-Rangliste |
| http://localhost:5173/admin | Organizer-Login |
| http://localhost:3001/health | API Healthcheck |

Im Dev-Modus proxyt Vite `/api` und `/assets` zur API — `VITE_API_URL` kann leer bleiben.

## Manuell testen

### 1. Admin

1. http://localhost:5173/admin öffnen
2. Login: `admin@tuning-podium.local` / `change-me-now-123` (aus `.env`)
3. **Event-QR** anzeigen oder als PNG speichern
4. Fahrzeuge anlegen, optional Bild hochladen

### 2. Abstimmen

1. http://localhost:5173/vote öffnen (oder Event-QR scannen)
2. Platz 1/2/3 wählen → **Stimme abgeben**
3. Seite neu laden → „Du hast abgestimmt“ (Cookie + Geräte-Fingerprint)

Zweite Stimme vom selben Gerät wird mit `409` abgelehnt.

### 3. Leaderboard

http://localhost:5173/leaderboard — aktualisiert sich automatisch (Live-Sync ca. alle 8 Sekunden). Auf dem Handy: **nach unten ziehen** zum manuellen Aktualisieren.

### API direkt (optional)

```bash
# Session + Cookie
curl -c /tmp/podium.cookies http://localhost:3001/api/votes/session

# Fahrzeuge
curl http://localhost:3001/api/vehicles/

# Leaderboard
curl http://localhost:3001/api/leaderboard/
```

## Troubleshooting

### `The migration ... was modified after it was applied`

Lokale DB hat einen veralteten Prisma-Eintrag (passiert nach Migration-Fixes). Einmal aufräumen:

```bash
PGPASSWORD=podium psql -h localhost -p 5433 -U podium -d tuning_podium \
  -c "DELETE FROM \"_prisma_migrations\" WHERE rolled_back_at IS NOT NULL;"
```

Danach: `cd apps/api && bun run prisma:dev` — oder einfach `bun run db:migrate`.

Für einen komplett frischen Dev-Stand (löscht alle Daten):

```bash
cd apps/api && bunx prisma migrate reset
bun run db:seed
```

## Nützliche Commands

```bash
bun run check          # Typecheck (+ Web-Build)
bun run build          # Production-Build
bun run db:migrate     # Migrationen anwenden
bun run db:studio      # Prisma Studio
bun run db:down        # Postgres stoppen
```

## Projektstruktur

```
tuning-podium/
├── apps/
│   ├── api/          # Elysia + Prisma
│   └── web/          # Vue + shadcn-vue + PWA
├── docker-compose.yml
└── .env.example
```

## Wichtige Env-Variablen

| Variable | Beschreibung |
|----------|--------------|
| `DATABASE_URL` | Postgres (Default: `localhost:5433`) |
| `JWT_SECRET` | Admin-JWT (min. 32 Zeichen) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Initial-Admin beim Start |
| `CORS_ORIGIN` | Frontend-Origin (`http://localhost:5173`) |
| `VITE_PUBLIC_APP_URL` | Basis-URL für Event-QR |

## Produktion (kurz)

1. `VITE_PUBLIC_APP_URL` und `PUBLIC_APP_URL` auf die echte Domain setzen
2. `JWT_SECRET`, `ADMIN_PASSWORD` und `TRUST_PROXY=true` hinter Reverse-Proxy
3. `bun run build` → API mit `bun start`, Web-Static aus `apps/web/dist`

## Docker (Server)

Für lokale Entwicklung reicht weiterhin nur Postgres: `bun run db:up`.

Vollständiger Stack (Postgres + API + Nginx mit Frontend):

```bash
cp .env.docker.example .env
# JWT_SECRET, ADMIN_PASSWORD, POSTGRES_PASSWORD, PUBLIC_APP_URL setzen

docker compose --profile prod up -d --build
# oder: bun run docker:prod
```

| URL | Beschreibung |
|-----|--------------|
| http://localhost:8080 | Frontend (Port über `HTTP_PORT`) |
| http://localhost:8080/health | API Healthcheck (via Nginx) |

Nginx liefert die Vue-App und proxyt `/api`, `/assets` und `/health` zur API. Uploads liegen im Volume `podium_uploads`.

Hinter HTTPS-Terminierung (Caddy, Traefik, nginx): nur Port 80/443 des Reverse-Proxys nach `web:80` leiten und `PUBLIC_APP_URL` auf `https://…` setzen. Bei Bedarf `web`-Ports in `docker-compose.yml` entfernen und den Proxy ins Docker-Netz hängen.

Stoppen: `docker compose --profile prod down` bzw. `bun run docker:prod:down`.
