# Development Setup

## Environment Variables

For the full environment variable list and descriptions, see [CONTRIBUTING.md](../CONTRIBUTING.md#environment-variables).

### Local Setup

1. Create a `.env` file in the project root
2. Copy variables from `.env.example` (if available)
3. Fill in required values
4. Do not commit `.env`

### Docker Compose Defaults

When using Docker Compose, variables can be supplied from environment or `.env`. The following defaults exist in `docker-compose.yml`:

- `NEO4J_AUTH`: `neo4j/neo4j`
- `NEO4J_PASSWORD`: `neo4j`
- `NEO4J_USERNAME`: `neo4j`
- `VITE_SERVER_NAME`: app title
- `VITE_BASE_URL`: `http://localhost:3000`
- `VITE_GRAPHQL_URL`: `http://localhost:4000`
- `VITE_ENVIRONMENT`: `development`

## Running the App

Core commands:

- `pnpm run dev` - start development server at http://localhost:3000
- `pnpm run build` - build for production
- `pnpm run tsc` - TypeScript type checking
- `pnpm run test:unit` - run unit tests
- `pnpm run test:playwright` - run Playwright tests
- `pnpm run build:playwright:mocked` - build the mocked app for faster parallel Playwright runs
- `pnpm run test:playwright:mocked:build` - run mocked Playwright against the prebuilt app

For detailed development standards, testing conventions, and workflow guidance, see [CLAUDE.md](../CLAUDE.md).

### Troubleshooting the dev server

- **Open `http://localhost:3000`, not `127.0.0.1`.** The dev server binds
  `localhost` because `VITE_BASE_URL` and the Auth0 callback use
  `http://localhost:3000`. (Playwright starts its own server on `127.0.0.1`
  with its own flags, so tests are unaffected.)
- **"Upgrade Required" (HTTP 426).** Another process's WebSocket listener,
  typically Vite's HMR socket from a second dev server started in another
  checkout or worktree, is answering on port 3000. Stop the other dev server
  and restart this one.
- **Fresh checkouts and worktrees.** Run `pnpm install` and then
  `pnpm exec nuxi prepare` before `pnpm run test:unit`. Without the generated
  `.nuxt/tsconfig.json`, every spec fails with "Failed to load tsconfig".
  Copy your `.env` from your main checkout. A typical local `.env` points
  `VITE_GRAPHQL_URL` at a local backend on port 4000.

## Testing

Integration tests are in the `tests/playwright` directory.
