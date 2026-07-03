FROM node:24-alpine

WORKDIR /app

# Enable pnpm via corepack (version pinned by package.json "packageManager")
RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

# Build the Nuxt application
RUN pnpm run build

EXPOSE 3000

# Add debug environment variables
ENV NODE_ENV=development
ENV DEBUG=*
ENV NITRO_DEBUG=1

# Start with verbose debugging
CMD ["sh", "-c", "echo 'Debug: Current directory:' && pwd && \
echo 'Debug: Directory contents:' && ls -la && \
echo 'Debug: Output directory contents:' && ls -la .output/server/ && \
echo 'Debug: Starting server with full logging...' && \
NITRO_DEBUG=1 node --trace-warnings .output/server/index.mjs 2>&1"]