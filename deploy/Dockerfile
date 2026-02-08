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
RUN cd packages/backend && cp .env.production .env && npx prisma generate && npm run build

# --- Stage 2: Build CMS (.NET 9) ---
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS dotnet-builder
WORKDIR /src

# Copy CMS source
COPY CMS/ ./

# Publish the specific project
RUN dotnet publish examples/PostgresDemo/PostgresWebApp/PostgresWebApp.csproj -c Release -o /app/publish

# --- Stage 3: Final Runtime ---
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Install Node.js & Nginx
RUN apt-get update && apt-get install -y curl nginx procps && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Configure Nginx
COPY CMS/deploy/nginx.conf /etc/nginx/nginx.conf

# Copy Built Node.js App
COPY --from=builder /app /app

# Copy Built CMS App
COPY --from=dotnet-builder /app/publish ./cms
# Ensure appsettings is writable
RUN touch ./cms/appsettings.json && chmod 666 ./cms/appsettings.json

# Copy Entrypoint
COPY CMS/deploy/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose Nginx Port
EXPOSE 5000

# Entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
