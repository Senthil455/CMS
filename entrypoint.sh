#!/bin/bash
set -e

echo "[ENTRYPOINT] Starting startup sequence..."

# Default Environment Variables for Backend
export DATABASE_URL=${DATABASE_URL:-"file:/app/packages/backend/sessions.db"}
export PORT=${PORT:-"3001"}
export CMS_BASE_URL=${CMS_BASE_URL:-"http://0.0.0.0:5000"}
export FRONTEND_URL=${FRONTEND_URL:-"http://localhost:3001"}
export NODE_ENV=${NODE_ENV:-"production"}
export LOG_LEVEL_FASTIFY=${LOG_LEVEL_FASTIFY:-"debug"}
export DEBUG="fastify:*"

# Start CMS (Port 5000)
echo "[ENTRYPOINT] Starting CMS in background..."
cd /app/cms
dotnet CMS.Course.dll --urls "http://0.0.0.0:5000" &

# Wait a bit for CMS to initialize
sleep 2

# Start Cms Backend (Port 3001)
echo "[ENTRYPOINT] Starting Cms Backend in foreground (tsx)..."
cd /app/packages/backend
/app/node_modules/.bin/tsx src/index.ts
