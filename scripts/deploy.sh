#!/usr/bin/env bash
set -euo pipefail

cd /var/www/peladora/app

echo "== Pull latest =="
git fetch --all --prune
git reset --hard origin/master   # si tu rama principal es master

echo "== Install deps =="
npm ci

echo "== Build =="
npm run build

echo "== Prisma =="
npx prisma generate
# Si usás migraciones en prod:
# npx prisma migrate deploy

echo "== Restart PM2 =="
pm2 reload peladora-backend --update-env || pm2 start dist/main.js --name peladora-backend

echo "== Done =="
pm2 status
