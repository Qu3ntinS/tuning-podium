#!/bin/sh
set -e

cd /app/apps/api

echo "Applying database migrations…"
bunx prisma migrate deploy
bunx prisma generate

echo "Starting API…"
exec bun src/server.ts
