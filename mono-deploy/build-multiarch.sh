#!/bin/bash
set -e

# Get the absolute path to the directory containing this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_ROOT="$SCRIPT_DIR/../.."

# Docker Hub image name (override with IMAGE_NAME env var)
IMAGE_NAME="${IMAGE_NAME:-senthil455/cms-mono:latest}"

# Target platforms (override with PLATFORMS env var)
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"

echo "🚀 Building CMS (Frontend & Backend) locally..."
cd "$REPO_ROOT/CMS"
# Install deps if needed (fast if cached)
npm install --silent

# Build Shared
npm run build:shared --silent

# Build Frontend
npm run build --workspace=@cms/app --silent
npm run build --workspace=@cms/admin --silent
npm run build --workspace=@cms/portal --silent

# Build Backend (Prisma + TSC)
cd packages/service
npm install --silent # Ensure local backend deps are simpler to find
npx prisma generate
npm run build --silent

echo "🚀 Building CMS (.NET) locally..."
cd "$REPO_ROOT/CMS"
# Clean previous publish to avoid stale files
rm -rf publish
dotnet publish server/CMS.MonoApp/CMS.MonoApp.csproj -c Release -o ./publish

echo "🐳 Building multi-platform Docker image..."
echo "   Image:     $IMAGE_NAME"
echo "   Platforms: $PLATFORMS"
echo "   Context:   $REPO_ROOT"
echo "   Dockerfile: $SCRIPT_DIR/Dockerfile"

# Ensure buildx builder exists
BUILDER_NAME="cms-multiarch"
if ! docker buildx inspect "$BUILDER_NAME" &>/dev/null; then
    echo "📦 Creating buildx builder: $BUILDER_NAME"
    docker buildx create --name "$BUILDER_NAME" --use
else
    docker buildx use "$BUILDER_NAME"
fi

# Build and push multi-platform image
cd "$SCRIPT_DIR"
docker buildx build \
    --platform "$PLATFORMS" \
    -t "$IMAGE_NAME" \
    -f "Dockerfile" \
    --push \
    "$REPO_ROOT"

echo "✅ Build complete! Image pushed: $IMAGE_NAME"
echo "   Platforms: $PLATFORMS"
