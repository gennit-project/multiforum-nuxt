# Keep build and runtime aligned with .nvmrc and CI. The arguments also make
# deliberate patch-version updates easy to audit in release PRs.
ARG NODE_VERSION=26.5.1
ARG PNPM_VERSION=10.28.2

FROM node:${NODE_VERSION}-alpine AS build

ARG PNPM_VERSION

WORKDIR /app

# Node 26 no longer bundles Corepack, so install the repository-pinned package
# manager explicitly.
RUN npm install --global "pnpm@${PNPM_VERSION}"

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Deployment-specific configuration is supplied when the built server starts,
# so this image can be promoted between environments without rebuilding.
ENV NITRO_PRESET=node-server

RUN NODE_OPTIONS=--max-old-space-size=2048 pnpm run build

FROM node:${NODE_VERSION}-alpine AS runtime

LABEL org.opencontainers.image.title="Multiforum Frontend" \
  org.opencontainers.image.description="Nuxt web application for Multiforum" \
  org.opencontainers.image.licenses="MIT"

WORKDIR /app

ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build --chown=node:node /app/.output ./.output

USER node
EXPOSE 3000

# Check only that the Node server is listening. Backend and integration health
# are separate concerns and should not make the frontend container unhealthy.
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=12 \
  CMD node -e "const socket=require('net').connect(process.env.PORT||3000,'127.0.0.1');socket.setTimeout(4000);socket.on('connect',()=>{socket.destroy();process.exit(0)});socket.on('timeout',()=>{socket.destroy();process.exit(1)});socket.on('error',()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
