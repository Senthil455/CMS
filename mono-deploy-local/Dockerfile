# --- Stage 1: Setup Node.js Middleware ---
FROM node:24-slim AS node-base
WORKDIR /app

# Install runtime dependencies for backend (openssl for prisma)
RUN apt-get update -y && apt-get install -y openssl procps curl && rm -rf /var/lib/apt/lists/*

# 1. Copy package definitions to install dependencies
COPY CMS/package.json cms/package-lock.json ./
COPY CMS/packages/shared/package.json ./packages/shared/
COPY CMS/packages/service/package.json ./packages/service/
COPY CMS/packages/app/package.json ./packages/app/
# Also copy SDK which is a dependency now
COPY CMS/packages/sdk/package.json ./packages/sdk/

# 2. Install PROD dependencies
# Note: In multi-arch, we might need to be careful with native modules, but pure JS deps are fine.
# If implicit 'npm ci' fails due to platform specifics of lockfile, we use 'npm install'
RUN npm install --omit=dev

# 3. Copy pre-built artifacts from LOCAL machine
COPY CMS/packages/shared/dist ./packages/shared/dist
# Copy backend artifacts AND source files (for tsx if needed, though we should run compiled js)
COPY CMS/packages/service/dist ./packages/service/dist
COPY CMS/packages/service/src ./packages/service/src
COPY CMS/packages/service/resources ./packages/service/resources
COPY CMS/packages/service/public ./packages/service/public
COPY CMS/packages/service/prisma ./packages/service/prisma

# Generate Prisma Client (needs to run on target arch)
RUN cd packages/service && npx prisma generate

# Copy frontend artifacts
COPY CMS/packages/app/dist ./packages/app/dist
COPY CMS/packages/admin/dist ./packages/admin/dist
COPY CMS/packages/portal/dist ./packages/portal/dist
COPY CMS/packages/stash/dist ./packages/stash/dist

# --- Stage 2: Final Image (Hybrid .NET + Node) ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

# Start Node.js & Nginx
RUN apt-get update && apt-get install -y curl nginx procps dos2unix && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g tsx && \
    rm -rf /var/lib/apt/lists/*

# Configure Nginx
COPY CMS/mono-deploy-local/nginx.conf /etc/nginx/nginx.conf
COPY CMS/mono-deploy-local/404.html /usr/share/nginx/html/404.html

# Copy Node.js App from node-base
COPY --from=node-base /app /app

# Copy Pre-built .NET App from LOCAL machine
# .NET Publish output is portable if not self-contained
COPY CMS/publish ./cms
# Ensure config files are writable
RUN touch ./cms/appsettings.json && chmod 666 ./cms/appsettings.json

# Copy Entrypoint
COPY CMS/mono-deploy-local/entrypoint.sh /app/entrypoint.sh
RUN dos2unix /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 5000
ENTRYPOINT ["/app/entrypoint.sh"]
