#!/bin/bash
set -e

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_ROOT="$SCRIPT_DIR/../.."

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

echo "🐳 Building Docker Image (Fast Mode)..."
cd "$SCRIPT_DIR"
docker build -t cms-mono-deploy:latest -f Dockerfile.fast "$REPO_ROOT"

echo "✅ Build complete! Image: cms-mono-deploy:latest"
echo "👉 Run ./reload.sh to restart the container."
