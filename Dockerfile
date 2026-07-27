# syntax=docker/dockerfile:1

FROM oven/bun:1.3 AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN bun install --frozen-lockfile --ignore-scripts

# --- API (Bun + Prisma) ---
FROM deps AS api
WORKDIR /app

COPY apps/api apps/api

RUN cd apps/api && bunx prisma generate

COPY docker/api-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
WORKDIR /app/apps/api

EXPOSE 3001
ENTRYPOINT ["/entrypoint.sh"]

# --- Web build ---
FROM deps AS web-build
WORKDIR /app

COPY apps/web apps/web

ARG VITE_PUBLIC_APP_URL=http://localhost:8080
ARG VITE_API_URL=
ENV VITE_PUBLIC_APP_URL=$VITE_PUBLIC_APP_URL
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app/apps/web
RUN bunx vite build

# --- Web (Nginx + static) ---
FROM nginx:1.27-alpine AS web

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
