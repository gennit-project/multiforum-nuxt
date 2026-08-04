FROM node:26.5.1-alpine

ARG MULTIFORUM_BACKEND_REPOSITORY=https://github.com/gennit-project/multiforum-backend.git
ARG MULTIFORUM_BACKEND_REF=main

WORKDIR /app

RUN apk add --no-cache git \
  && npm install --global pnpm@10.28.2

# Fetch exactly the selected branch, tag, or commit without requiring a second
# repository checkout beside this frontend repository.
RUN git init \
  && git remote add origin "$MULTIFORUM_BACKEND_REPOSITORY" \
  && git fetch --depth 1 origin "$MULTIFORUM_BACKEND_REF" \
  && git checkout --detach FETCH_HEAD \
  && rm -rf .git

RUN pnpm install --frozen-lockfile
RUN NODE_OPTIONS=--max-old-space-size=2048 pnpm run build

EXPOSE 4000
CMD ["pnpm", "run", "start"]
