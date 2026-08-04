FROM node:26.5.1-alpine AS build

WORKDIR /app

# Node 26 no longer bundles Corepack, so install the repository-pinned package
# manager explicitly.
RUN npm install --global pnpm@10.28.2

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Vite values are embedded in the client bundle at build time. Compose passes
# browser-reachable defaults; other image consumers can override these args.
ARG NUXT_PUBLIC_AUTH_PROVIDER=auth0
ARG NUXT_BACKEND_GRAPHQL_URL=
ARG VITE_BASE_URL=http://localhost:3000
ARG VITE_ENVIRONMENT=production
ARG VITE_GRAPHQL_URL=http://localhost:4000
ARG VITE_SERVER_NAME=Multiforum
ENV NUXT_PUBLIC_AUTH_PROVIDER=$NUXT_PUBLIC_AUTH_PROVIDER
ENV NUXT_BACKEND_GRAPHQL_URL=$NUXT_BACKEND_GRAPHQL_URL
ENV NITRO_PRESET=node-server
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_ENVIRONMENT=$VITE_ENVIRONMENT
ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL
ENV VITE_SERVER_NAME=$VITE_SERVER_NAME

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
