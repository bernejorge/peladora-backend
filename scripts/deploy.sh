#!/usr/bin/env bash
set -euo pipefail

# --- FIX: cargar NVM en shells no interactivos (GitHub Actions / appleboy) ---
export NVM_DIR="/root/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi

# Elegí la versión (usa la default si ya está seteada)
nvm use 20 >/dev/null 2>&1 || true

# Alternativa extra (por si nvm no carga bien):
export PATH="/root/.nvm/versions/node/v20.0.0/bin:$PATH"

# ---------------------------------------------------------------------------

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
