FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build the Nuxt application
RUN npm run build

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