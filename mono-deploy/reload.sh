#!/bin/bash
set -e

# Get the absolute path to the directory containing this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "Navigating to: $SCRIPT_DIR"
cd "$SCRIPT_DIR"

echo "Reloading 'app' service..."

# Stop the specific container if it exists
docker compose stop app

# Remove the container to ensure a fresh run
docker compose rm -f app

# Run the container using the latest image
# -d: Detached mode
# --no-deps: Don't restart dependent services (db) if they are running
# --build: Optional, ensures build (though we built explicitly) - omitted here as we rely on the image tag
docker compose up -d app

echo "Container reloaded with latest image."
