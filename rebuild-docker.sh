#!/bin/bash

# Stop and remove the existing container if it exists
echo "Stopping and removing existing container..."
docker stop cms-container || true
docker rm cms-container || true

# Build the image from the parent directory
echo "Building Docker image..."
# Move to the parent directory to include both cms and cms in the context
cd ..
docker build -f cms/Dockerfile -t cms-integrated .

# Run the new container
echo "Starting new container..."
docker run -d \
  --name cms-container \
  -p 5000:5000 \
  cms-integrated

echo "Container cms-container is up and running."
docker ps | grep cms-container
