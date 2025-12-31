# --- Stage 1: Build Frontend & Backend ---
FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies (utilizing workspace support)
COPY CMS/package.json cms/package-lock.json ./
COPY CMS/packages/shared/package.json ./packages/shared/
COPY CMS/packages/backend/package.json ./packages/backend/
COPY CMS/packages/frontend/package.json ./packages/frontend/
RUN npm install

# Copy Cms source code
COPY CMS/ .

# Build Shared Package
RUN npm run build:shared

# Build Frontend (outputs to packages/frontend/dist)
RUN cd packages/frontend && npm run build

# Build Backend
RUN cd packages/backend && npx prisma generate && npm run build

# --- Stage 2: Build CMS (.NET 8) ---
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS dotnet-builder
WORKDIR /src

# Copy CMS source
# Note: Requires cms/server directory to be in build context
COPY CMS/server/ ./

# Publish the specific project
RUN dotnet publish CMS.Course/CMS.Course.csproj -c Release -o /app/publish

# --- Stage 3: Final Runtime ---
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Install Node.js in the .NET Runtime image
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy Built Node.js App
COPY --from=builder /app /app

# Copy Built CMS App
COPY --from=dotnet-builder /app/publish ./cms

# Copy specific appsettings.json
COPY CMS/server/CMS.Course/appsettings.json ./cms/

# Set Permissions
RUN chmod +x /app/entrypoint.sh

# Expose Ports
EXPOSE 3001 5000

# Entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
