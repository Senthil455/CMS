#!/bin/bash
set -e

echo "[ENTRYPOINT] Starting startup sequence..."

# Default Environment Variables
export DATABASE_URL=${DATABASE_URL:-"file:/app/packages/service/sessions.db"}
export PORT=${PORT:-"3001"}
export CMS_BASE_URL=${CMS_BASE_URL:-"http://127.0.0.1:5001"} # Internal .NET port
export FRONTEND_URL=${FRONTEND_URL:-"http://127.0.0.1:3001"}

# CMS Configuration from Environment Variables
export DATABASE_PROVIDER=${DATABASE_PROVIDER:-1}  # Default to Postgres
export CONNECTION_STRING=${CONNECTION_STRING:-"Host=db;Port=5432;Database=cms;Username=postgres;Password=postgres;"}

# Use custom config path if set, otherwise default
if [ -n "$CMS_DATA_PATH" ]; then
  CONFIG_PATH="$CMS_DATA_PATH/config/cms.settings.json"
else
  CONFIG_PATH="/app/cms/cms.settings.json"
fi

# Generate cms.settings.json from environment variables if not exists
if [ ! -f "$CONFIG_PATH" ]; then
  echo "[ENTRYPOINT] Writing settings to $CONFIG_PATH..."
  mkdir -p "$(dirname "$CONFIG_PATH")"
  echo "{\"Cms\":{\"DatabaseProvider\":${DATABASE_PROVIDER},\"ConnectionString\":\"${CONNECTION_STRING}\",\"Spas\":null}}" > "$CONFIG_PATH"
  echo "[ENTRYPOINT] Write complete. File size:"
  ls -l "$CONFIG_PATH"
  cat "$CONFIG_PATH"
else
  echo "[ENTRYPOINT] $CONFIG_PATH already exists. Skipping generation."
  cat "$CONFIG_PATH"
fi


echo "[ENTRYPOINT] CMS configuration:"
echo "  Database Provider: ${DATABASE_PROVIDER}"
echo "  Connection String: ${CONNECTION_STRING}"

# Set Max Request Size for Nginx
MAX_REQUEST_SIZE=${CMS_MAX_REQUEST_SIZE:-50000000}
sed -i "s/__MAX_REQUEST_SIZE__/${MAX_REQUEST_SIZE}/g" /etc/nginx/nginx.conf

# Start Nginx
echo "[ENTRYPOINT] Starting Nginx..."
nginx

# Start Node.js (CMS Backend) in background
echo "[ENTRYPOINT] Starting CMS (Node.js) on port 3001..."
cd /app/packages/service
npx prisma db push --accept-data-loss
tsx src/index.ts &

# Start CMS (.NET) in a loop
echo "[ENTRYPOINT] Starting CMS (.NET) loop on port 5001..."
cd /app/cms

while true; do
  echo "[LOOP] Starting .NET process..."
  # Run in foreground of this sub-shell, but wait for it
  dotnet CMS.MonoApp.dll --urls "http://127.0.0.1:5001" || true
  
  echo "[LOOP] .NET process exited. Restarting in 1 second..."
  sleep 1
done
