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

- `npm run dev` - start development server
- `npm run build` - build for production
- `npm run tsc` - TypeScript type checking
- `npm run test:unit` - run unit tests
- `npm run test` - open Cypress runner

For detailed development standards, testing conventions, and workflow guidance, see [CLAUDE.md](../CLAUDE.md).

## Testing

Integration tests are in the `cypress` directory.
