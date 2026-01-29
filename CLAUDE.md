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

### Cypress Test Optimizations

- **Replace arbitrary timeouts with network waits**:

  ```javascript
  // Before: Fixed timeout that might be too short or too long
  cy.get('button').contains('Save').click().wait(3000);

  // After: Wait for the actual network request to complete
  cy.intercept('POST', '**/graphql').as('graphqlRequest');
  cy.get('button').contains('Save').click();
  cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
  ```

- **Validate network responses**: Add status code checks to ensure operations completed successfully

  ```javascript
  cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
  ```

- **Intercept specific GraphQL operations** by pattern-matching on the request body:

  ```javascript
  // Match specific GraphQL operations
  cy.intercept('POST', '**/graphql', (req) => {
    if (req.body.query.includes('createDiscussion')) {
      req.alias = 'createDiscussionRequest';
    }
  });

  // Later in the test
  cy.wait('@createDiscussionRequest');
  ```

## Vitest Testing (Unit)

- Unit tests are located in `tests/unit` directory
- Run all unit tests with `npm run test:unit`
- Run specific tests with `npm run test:unit -- --run tests/unit/path/to/test.spec.ts`
- Use exactly one `expect(...)` assertion per `it(...)` test case
- If you need multiple checks, split into multiple `it(...)` blocks or combine into a single structured `expect(...)`
- Prefer `it.each(...)` tables when it helps keep tests DRY

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
  - **Import GraphQL Types**: When fixing TypeScript errors, prefer importing proper types from `@/__generated__/graphql` over using `any`
  - **Examples**: Use `User`, `Comment`, `Discussion`, `Event`, `Revision`, `TextVersion` etc. from the generated GraphQL schema
  - **Avoid `any`**: Only use `any` as a last resort when proper types are not available
  - **Type Checking**: Use `npm run tsc` (which runs `vue-tsc --noEmit`) for proper Vue component type checking

### Common TypeScript Patterns and Fixes

- **GraphQL Type Completion**: When creating objects that match GraphQL types, ensure all required properties are included

  ```typescript
  // Example: TextVersion requires AuthorConnection
  const textVersion: TextVersion = {
    id: 'current',
    body: content,
    createdAt: new Date().toISOString(),
    Author: user,
    AuthorConnection: {
      edges: [],
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
      totalCount: 0,
    },
  };
  ```

- **Vue Router Type Safety**: Use proper route object structure for navigation

  ```typescript
  // Avoid: path property may not be compatible with router types
  routeAndClose({ path: '/account_settings' });

  // Prefer: use name-based routing
  routeAndClose({ name: 'account_settings' });
  ```

- **Error Type Handling**: GraphQL error objects may have inferred types as `never` in some contexts

  ```typescript
  // Cast to access message property when TypeScript can't infer the error type
  :text="(getCommentError as any)?.message || 'Error loading comment'"
  ```

- **Form Value Types**: Ensure form default values match the expected type interface completely

  ```typescript
  // If CreateEditChannelFormValues includes eventsEnabled and feedbackEnabled
  const defaultValues = {
    // ... other properties
    eventsEnabled: true, // Don't forget these!
    feedbackEnabled: true,
  };
  ```

- **Nuxt Page Meta**: Use proper placement and TypeScript handling

  ```typescript
  // Place at top of script setup block with TypeScript ignore
  // @ts-ignore - definePageMeta is auto-imported by Nuxt
  definePageMeta({
    middleware: 'some-middleware',
  });
  ```

- **GraphQL Query Imports**: When refactoring queries, check that exports exist in the target file

  ```typescript
  // Before using GET_MOD_SUSPENSION, verify it exists in the queries file
  // If not available, find similar queries like GET_SUSPENDED_MODS_BY_CHANNEL
  ```

- **Optional Chaining vs Null Coalescing**: Use appropriate patterns for component props
  ```typescript
  // For optional props that might be undefined
  :old-version="activeRevision.oldVersionData || {}"
  :new-version="activeRevision.newVersionData || {}"
  ```
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
- **Apollo useMutation**: Always leverage `useMutation`’s built-in `loading`, `error`, and `onDone` hooks instead of recreating that state yourself. Bind UI disabled/loading states directly to the mutation’s `loading` ref and surface errors via the `error` ref.
- **Naming**: camelCase for variables/functions, PascalCase for components/interfaces
- **Imports**: Group imports by type (Vue, libraries, local components, utils)
- **Testing**: Each feature requires Cypress tests, seed data before tests and clean up after
- **CSS**: Use Tailwind utility classes, dark mode compatible with `dark:` prefix
- **Composables**: Extract reusable logic into composables under `composables/` directory
- **Reactivity and Watchers**:
  - Avoid unnecessary watchers. Use Vue's built-in reactivity system (props, computed, refs) whenever possible
  - Use watchers only when absolutely necessary (e.g., for router param changes or external API calls)
  - When a component needs to react to prop changes, handle this through the component lifecycle or computed properties, not watchers
  - For individual item state that doesn't need to be shared, use local `ref` variables instead of Pinia store state

## Cypress Testing Guidelines

- **Always use URL constants**: Never use relative URLs like `cy.visit('/')` in tests
  - Use the constants defined in `tests/cypress/e2e/constants.ts` for all URLs
  - Example: `cy.visit(DISCUSSION_LIST)` instead of `cy.visit('/')`
- **Use network waiting**: Wait for requests to complete rather than arbitrary timeouts
  ```typescript
  // Set up interception
  cy.intercept('POST', '**/graphql').as('graphqlRequest');
  // Perform action
  cy.get('button').click();
  // Wait for request to complete
  cy.wait('@graphqlRequest').its('response.statusCode').should('eq', 200);
  ```

### Programmatic Authentication in Cypress Tests

For tests that need authentication, use this pattern for reliable programmatic authentication:

```typescript
it('should test authenticated functionality', () => {
  // Set up GraphQL interceptions first
  cy.intercept('POST', '**/graphql').as('graphqlRequest');

  // Visit the page first to load auth functions
  cy.visit(YOUR_PAGE_URL);

  // Set the auth token programmatically
  cy.loginAsAdmin();

  // Wait for page to fully load and auth functions to be available
  cy.wait(1000);

  // Manually sync the reactive auth state
  cy.window().then((win) => {
    const testWin = win as any;
    if (testWin.__SET_AUTH_STATE_DIRECT__) {
      console.log('Setting auth state directly');
      testWin.__SET_AUTH_STATE_DIRECT__({ username: 'cluse' });
    } else {
      console.log('Auth sync functions not available yet');
    }
  });

  // Verify authentication is complete
  cy.window().its('localStorage').invoke('getItem', 'token').should('exist');

  // Continue with your test...
});
```

**Key Points:**

- **Do NOT use `cy.loginAsAdminWithUISync()`** - it has timing issues and visits different pages
- **Visit your target page first** - this loads the `useTestAuth` composable and auth sync functions
- **Use `cy.loginAsAdmin()` to set the token** - this only sets localStorage, not reactive state
- **Call `__SET_AUTH_STATE_DIRECT__()` manually** - this updates the reactive state so UI shows authenticated state
- **Cast window as `any`** - avoids TypeScript errors with Cypress window type
- **Always verify token exists** - ensures the auth setup worked

**Why this pattern works:**

1. The `useTestAuth` composable is loaded by the default layout on every page
2. It exposes `__SET_AUTH_STATE_DIRECT__` function on the window object
3. This function directly updates `isAuthenticatedVar` and other reactive auth state
4. The UI immediately reflects the authenticated state without needing page refreshes

**Update existing tests:**

- Replace UI-based authentication (`loginUser()`) with this programmatic pattern
- Replace `cy.loginAsAdminWithUISync()` calls with this manual approach
- This pattern is faster and more reliable than UI-based authentication

## Permission System

The application has two separate but related permission systems:

1. **User Permissions** - Control what regular users can do (create content, upvote, etc.)
2. **Moderator Permissions** - Control what moderators can do (archive content, give feedback, etc.)

### User Permission Levels

1. **Standard Users**:
   - Use the DefaultChannelRole for the channel (or DefaultServerRole as fallback)
   - Have permissions like createDiscussion, createComment, upvoteContent, etc.

2. **Channel Admins/Owners**:
   - Users in the `Channel.Admins` list
   - Have all user and moderator permissions automatically

3. **Suspended Users**:
   - Users in the `Channel.SuspendedUsers` list
   - Have very restricted permissions via SuspendedRole (or DefaultSuspendedRole as fallback)

### Moderator Permission Levels

1. **Standard/Normal Moderators**:
   - All authenticated users are considered standard moderators by default
   - Not explicitly included in `Channel.Moderators` list, not in `Channel.SuspendedMods`
   - Can perform basic moderation actions (report, give feedback) based on DefaultModRole
   - These permissions are controlled by the DefaultModRole configuration

2. **Elevated Moderators**:
   - Explicitly included in the `Channel.Moderators` list
   - Have additional permissions beyond standard moderators
   - Can typically archive content, manage other moderators, etc.
   - These permissions are controlled by the ElevatedModRole configuration

3. **Suspended Moderators**:
   - Included in the `Channel.SuspendedMods` list
   - Have severely restricted permissions
   - These permissions are controlled by the SuspendedModRole configuration

### Important Concepts

- **Role Determination**:
  - User roles are determined by admin/owner status and suspension status
  - Mod roles are determined by presence in Moderators or SuspendedMods lists
- **Permission Flow**:
  - Channel-specific roles take precedence over server-wide defaults
  - Channel owners/admins bypass all permission checks (both user and mod)
  - Suspended status overrides all other status for that permission type
- **Fallback Chain**:
  - Channel-specific roles -> Server default roles -> Deny access

- **User vs. Mod Actions**:
  - Some UI actions require BOTH user and mod permissions
  - For example, to archive content: need canHideDiscussion (mod) AND be an elevated mod or admin

### Permission Implementation

- The `permissionUtils.ts` file contains the core permission checking logic for both systems
- The `headerPermissionUtils.ts` file implements component-specific permission logic for UI elements
- Channel owners/admins (users in `Channel.Admins` list) bypass all permission checks

### Permission Checking Flow

1. Check if the user is a channel owner/admin - if yes, grant all permissions
2. Check user suspension status - if suspended, use suspended role permissions
3. Check mod suspension status - if suspended mod, use suspended mod role permissions
4. Check if the user is an elevated mod - if yes, use elevated mod role permissions
5. Otherwise, use standard user/mod role permissions

Any UI component should respect the permissions provided by these roles without adding additional restrictions.

### Common Issues

- The moderator menus in headers (Discussion/Event/Comment) should show the "Give Feedback" and "Report" options for standard moderators
- The "Moderation Actions" menu section should appear for any user who has at least one moderation permission
- Ensure menu items are generated correctly in each header component by checking for specific permissions, not just moderator status

### Suspension System

The application enforces suspensions at both channel and server levels. Suspensions can be time-limited or indefinite.

#### How Suspensions Work

1. **Suspension Creation**: When a moderator suspends a user (e.g., via "Archive and Suspend" on a discussion), a `Suspension` node is created with:
   - `suspendedUntil` - Expiration date (for time-limited suspensions)
   - `suspendedIndefinitely` - Flag for permanent suspensions
   - Link to the related moderation issue

2. **Suspension Detection**: The backend checks for active suspensions when users attempt actions:
   - A suspension is active if `suspendedIndefinitely` is true OR `suspendedUntil` is in the future
   - Expired suspensions are automatically cleaned up (disconnected from channel relationships)

3. **Permission Enforcement**:
   - **Channel-level**: Suspended users use `SuspendedRole` permissions (typically very restricted)
   - **Server-level**: Users with any active suspension use `DefaultSuspendedRole` for server actions (e.g., creating new forums)

4. **User Notifications**: When a suspended user is blocked from an action, they receive an in-app notification explaining:
   - Which channel they're suspended in
   - What action was blocked
   - Reference to the related moderation issue

#### Suspension-Related E2E Tests

Tests for suspension functionality are located in `tests/cypress/e2e/suspensions/`:

- `suspendedUserPermissions.spec.cy.ts` - Tests that suspended users can't create discussions, comments, or events
- `serverLevelSuspension.spec.cy.ts` - Tests that suspended users can't create new forums

#### Unsuspension

Users can be unsuspended through the moderation issue interface, which removes the suspension relationship from the channel.

### Testing Moderator Permissions

When testing moderator permissions:

- Make sure the test user has the expected permission level
- Check that appropriate UI elements appear based on permission level
- Verify that unprivileged users don't see moderation options
- Test that suspended moderators can't access moderation features

## SSR and Hydration

### Preventing Hydration Mismatches

Hydration errors occur when the server-rendered HTML doesn't match what the client expects to render. Common causes:

1. **`v-if` conditions with async data**: If a condition depends on data that may differ between server and client (e.g., GraphQL query results, auth state), wrap the content in `<ClientOnly>`.

2. **Slot content with client-dependent conditions**: When passing slot content that has `v-if` conditions depending on async data, wrap the content in `<ClientOnly>` **at the source** (where the slot content is defined), not in the child component receiving the slot.

   ```vue
   <!-- WRONG: ClientOnly in the child component doesn't help -->
   <!-- components/Child.vue -->
   <template>
     <ClientOnly>
       <slot />
     </ClientOnly>
   </template>

   <!-- CORRECT: ClientOnly wraps the content at the source -->
   <!-- components/Parent.vue -->
   <template>
     <Child>
       <ClientOnly>
         <MyComponent v-if="asyncData" />
       </ClientOnly>
     </Child>
   </template>
   ```

3. **Auth-dependent UI**: Components that show different content based on authentication state should use `<ClientOnly>` since auth state is client-side only.

### Key Files with ClientOnly Wrappers

- `components/discussion/detail/DiscussionDetailContent.vue` - Comment form wrappers
- `components/discussion/detail/DiscussionCommentsWrapper.vue` - Subscribe button

## Project Structure

- Components in `components/` directory with subdirectories for features
- Pages in `pages/` directory matching route structure
- GraphQL queries/mutations in `graphQLData/` by domain
- Types in `types/` directory
- Utility functions in `utils/` directory (including permission utilities)

## Data Model Notes

- **Downloads**: There is no separate Download type. Downloads are discussions with the `hasDownload` field set to true. They use the Discussion type and are displayed with a different frontend skin in download-specific components.

## Working with Claude

- **Incremental Changes**: Make small, focused changes rather than large sweeping changes
  - Work on one test file at a time rather than multiple tests at once
  - Fix specific issues incrementally rather than rewriting multiple files
- **Step-by-Step Approach**: If multiple files need changes, address them one at a time
  - First understand the issue, then propose a targeted solution
  - Get confirmation before proceeding to the next file
- **Show Your Work**: Explain reasoning behind changes, especially for complex fixes
  - When troubleshooting, describe the issue and how the solution addresses it
  - Provide context for why a particular approach was chosen
