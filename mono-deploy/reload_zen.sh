#!/bin/bash
set -e

# Get the absolute path to the directory containing this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "Navigating to: $SCRIPT_DIR"
cd "$SCRIPT_DIR"

# Set environment variables for the Zen instance
export COMPOSE_PROJECT_NAME=zen
export APP_PORT=8000
export DB_PORT=5433

echo "Reloading 'zen' Project on port $APP_PORT..."

# Stop the specific container if it exists
docker compose stop app

# Remove the container to ensure a fresh run
docker compose rm -f app

# Run the container using the latest image
# -d: Detached mode
# --no-deps: Don't restart dependent services (db) if they are running
docker compose up -d app

echo "Zen environment reloaded on port $APP_PORT."
