FROM node:26.5.1-alpine

WORKDIR /app

# Node 26 no longer bundles Corepack, so install the pinned package manager directly.
RUN npm install --global pnpm@10.28.2

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
