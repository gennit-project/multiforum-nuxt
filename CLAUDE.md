# Multiforum Development Guide

## Build & Run Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Open Cypress test runner
- `npx cypress run --spec "cypress/e2e/discussions/createEditDeleteDiscussions.spec.cy.ts"` - Run specific test file
- `npx cypress run --spec "cypress/e2e/discussions/**/*.spec.cy.ts"` - Run all discussions tests
- `npm run tsc` - Run TypeScript type checking
- `npx eslint --fix path/to/file.vue` - Fix linting issues

## Cypress Testing
- Use `setupTestData()` from `support/testSetup.ts` to initialize data once per test file
- Use `loginUser()` to handle authentication for tests that need it
- Avoid multiple database resets with `beforeEach` - use shared test data when possible

## Code Style Guidelines
- **TypeScript**: Use strict typing whenever possible, proper interfaces in `types/` directory
- **Vue Components**: Use script setup API with TypeScript and properly typed props/emits
- **Error Handling**: Use try/catch with specific error types, validate GraphQL responses
- **Naming**: camelCase for variables/functions, PascalCase for components/interfaces
- **Imports**: Group imports by type (Vue, libraries, local components, utils)
- **Testing**: Each feature requires Cypress tests, seed data before tests and clean up after
- **CSS**: Use Tailwind utility classes, dark mode compatible with `dark:` prefix
- **Composables**: Extract reusable logic into composables under `composables/` directory

## Project Structure
- Components in `components/` directory with subdirectories for features
- Pages in `pages/` directory matching route structure
- GraphQL queries/mutations in `graphQLData/` by domain
- Types in `types/` directory