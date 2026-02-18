#!/bin/bash
set -e

# Get the absolute path to the directory containing this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# The context root is two levels up from the script (cms/deploy -> cms -> root)
# The Dockerfile assumes the context contains 'cms' and 'cms' folders.
CONTEXT_ROOT="$SCRIPT_DIR/../.."

# Docker Hub image name (override with IMAGE_NAME env var)
IMAGE_NAME="${IMAGE_NAME:-senthil455/cms-mono:latest}"

# Target platforms (override with PLATFORMS env var)
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"

echo "🐳 Building multi-platform Docker image..."
echo "   Image:     $IMAGE_NAME"
echo "   Platforms: $PLATFORMS"
echo "   Context:   $CONTEXT_ROOT"
echo "   Dockerfile: $SCRIPT_DIR/Dockerfile.multiarch"

# Ensure buildx builder exists
BUILDER_NAME="cms-multiarch"
if ! docker buildx inspect "$BUILDER_NAME" &>/dev/null; then
    echo "📦 Creating buildx builder: $BUILDER_NAME"
    docker buildx create --name "$BUILDER_NAME" --use
else
    docker buildx use "$BUILDER_NAME"
fi

# Build and push multi-platform image
docker buildx build \
    --platform "$PLATFORMS" \
    -t "$IMAGE_NAME" \
    -f "$SCRIPT_DIR/Dockerfile.multiarch" \
    --push \
    "$CONTEXT_ROOT"

echo "✅ Build complete! Image pushed: $IMAGE_NAME"
echo "   Platforms: $PLATFORMS"
