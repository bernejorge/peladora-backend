#!/usr/bin/env bash
set -euo pipefail

export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Usar la versión default del VPS (la que vos definís con nvm alias default)
nvm use default

echo "== Node =="
node -v
npm -v

cd /var/www/peladora/app

echo "== Pull latest =="
git fetch --all --prune
git reset --hard origin/master

echo "== Install deps =="
npm ci

echo "== Build =="
npm run build

echo "== Prisma =="
npx prisma generate
# npx prisma migrate deploy

echo "== Restart PM2 =="
pm2 reload peladora-backend --update-env || pm2 start dist/main.js --name peladora-backend

echo "== Done =="
pm2 status
