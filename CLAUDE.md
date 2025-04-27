# Multiforum Development Guide

## Build & Run Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Open Cypress test runner
- `npm run test:unit` - Run unit tests with Vitest
- `npx cypress run --spec "cypress/e2e/discussions/createEditDeleteDiscussions.spec.cy.ts"` - Run specific test file
- `npx cypress run --spec "cypress/e2e/discussions/**/*.spec.cy.ts"` - Run all discussions tests
- `npm run tsc` - Run TypeScript type checking
- `npx eslint --fix path/to/file.vue` - Fix linting issues

## Cypress Testing (E2E)
- Use `setupTestData()` from `support/testSetup.ts` to initialize data once per test file
- Use `loginUser()` to handle authentication for tests that need it
- Avoid multiple database resets with `beforeEach` - use shared test data when possible

## Vitest Testing (Unit)
- Unit tests are located in `tests/unit` directory
- Run all unit tests with `npm run test:unit`
- Run specific tests with `npm run test:unit -- --run tests/unit/path/to/test.spec.ts`

### Unit Test Best Practices
- **Test Real Code, Not Mocks**: Ensure tests verify actual application code rather than reimplementing logic in test files
  - Extract component logic into utility files when appropriate for better testability
  - Import and test the actual functions from your codebase rather than creating test-only implementations
- **Component Testing**:
  - Mount components to test actual validation logic, error messages, and UI state
  - Mock only external dependencies and services, not the core logic being tested
  - Verify that error/validation messages appear in the component when expected
- **Meaningful Tests**: Tests should validate application behavior, not trivial language features
  - Avoid tests that only check basic JavaScript functionality
  - Focus on edge cases, expected validations, and user interactions
- **Testable Code**: Refactor components to make logic more testable
  - Move complex formatting/validation logic to separate utility files
  - Use dependency injection to make components easier to test
- **Test Structure**: Organize tests to mirror the structure of the code being tested
  - Group related tests with descriptive names
  - Test both success and failure paths

## Pre-commit Workflow
- TypeScript type checking and unit tests run automatically before each commit
- The pre-commit hook runs the `verify` command which includes:
  - TypeScript type checking (`npm run tsc`)
  - Unit tests (`npm run test:unit:run`)
- Modified files are checked with lint-staged
  - TS and Vue files: ESLint + unit tests
  - Test files: Run the specific test that changed
- To skip pre-commit hooks temporarily: `git commit --no-verify`

## Code Style Guidelines
- **TypeScript**: Use strict typing whenever possible, proper interfaces in `types/` directory
- **Function Parameters**: For functions with more than one parameter, use a typed object instead of positional arguments
  ```typescript
  // Avoid:
  function updateUser(id: string, name: string, email: string) { ... }
  
  // Prefer:
  type UpdateUserParams = {
    id: string;
    name: string;
    email: string;
  };
  function updateUser(params: UpdateUserParams) { ... }
  ```
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