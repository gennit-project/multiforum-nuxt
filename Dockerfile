FROM node:26.5.1-alpine AS build

WORKDIR /app

# Node 26 no longer bundles Corepack, so install the repository-pinned package
# manager explicitly.
RUN npm install --global pnpm@10.28.2

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Deployment-specific configuration is supplied when the built server starts,
# so this image can be promoted between environments without rebuilding.
ENV NITRO_PRESET=node-server

RUN NODE_OPTIONS=--max-old-space-size=2048 pnpm run build

FROM node:26.5.1-alpine AS runtime

WORKDIR /app

ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build --chown=node:node /app/.output ./.output

USER node
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
