#!/bin/bash

# Ensure we are in the script's directory
cd "$(dirname "$0")"

echo "Checking if Docker DB is running..."
if [ ! "$(docker ps -q -f name=standalone-cms-db-1)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=standalone-cms-db-1)" ]; then
        # cleanup
        echo "Removing existing stopped container..."
        docker rm standalone-cms-db-1
    fi
    echo "Starting Database Container..."
    docker-compose up -d db
    echo "Waiting for Database to be ready..."
    sleep 5
fi

echo "Starting CMS Backend..."
echo "Press Ctrl+C to stop."

# Go to repository root to run project
cd ../..
dotnet run --project cms/server/CMS.App/CMS.App.csproj
