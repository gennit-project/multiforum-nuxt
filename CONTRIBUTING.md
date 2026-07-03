# Contributing to Multiforum

This guide will help you contribute to the Multiforum codebase, with a focus on testing practices.

This guide is for the **frontend** ([multiforum-nuxt](https://github.com/gennit-project/multiforum-nuxt)). The backend lives in [multiforum-backend](https://github.com/gennit-project/multiforum-backend); see its README for backend setup and architecture.

## Prerequisites

- **Node.js ≥ 24.13.0** (see the `engines` field in `package.json`). Older
  majors are not supported — Node 20, for example, crashes ESLint on
  `Object.groupBy`. If you use `nvm`, run `nvm use 24` before installing or
  running scripts.
- **npm** (bundled with Node).

## Environment Variables

The application requires several environment variables to be set up. Copy `.env.example` to `.env` and update the values.

### Core Application Variables

| Variable                   | Description                                         |
| -------------------------- | --------------------------------------------------- |
| `GRAPHQL_URL_FOR_TYPES`    | URL for GraphQL schema used in code generation      |
| `VITE_GRAPHQL_URL`         | URL for GraphQL API endpoint                        |
| `VITE_BASE_URL`            | Base URL for the application                        |
| `VITE_SERVER_NAME`         | Internal server name (must match backend config)    |
| `VITE_SERVER_DISPLAY_NAME` | User-facing name of the server                      |
| `VITE_ENVIRONMENT`         | Environment name (development, production, etc.)    |
| `NITRO_PRESET`             | Deployment preset for Nitro server (e.g., 'vercel') |

### Authentication Variables

| Variable                   | Description                          |
| -------------------------- | ------------------------------------ |
| `VITE_AUTH0_DOMAIN`        | Auth0 domain for authentication      |
| `VITE_AUTH0_CLIENT_ID`     | Auth0 application client ID          |
| `VITE_AUTH0_CLIENT_SECRET` | Auth0 application client secret      |
| `VITE_AUTH0_AUDIENCE`      | Auth0 API audience identifier        |
| `VITE_AUTH0_SCOPE`         | Auth0 permission scopes              |
| `VITE_AUTH0_URL`           | Auth0 token endpoint                 |
| `VITE_AUTH0_CALLBACK_URL`  | URL to redirect after authentication |
| `VITE_LOGOUT_URL`          | URL to redirect to after logout      |

### External Services Variables

| Variable                           | Description                                    |
| ---------------------------------- | ---------------------------------------------- |
| `VITE_GOOGLE_MAPS_API_KEY`         | API key for Google Maps integration            |
| `VITE_OPEN_CAGE_API_KEY`           | API key for OpenCage geocoding service         |
| `VITE_OPEN_GRAPH_API_KEY`          | API key for OpenGraph services                 |
| `VITE_GOOGLE_CLOUD_STORAGE_BUCKET` | Google Cloud Storage bucket for file uploads   |
| `VITE_SENTRY_AUTH_TOKEN`           | Sentry authentication token for error tracking |
| `VITE_SENTRY_DSN`                  | Sentry Data Source Name for error reporting    |
| `VITE_LIGHTGALLERY_LICENSE_KEY`    | License key for Lightgallery component         |

### Docker Compose Variables

| Variable                    | Description                                       |
| --------------------------- | ------------------------------------------------- |
| `NEO4J_AUTH`                | Neo4j database authentication (username/password) |
| `NEO4J_USERNAME`            | Neo4j database username                           |
| `NEO4J_PASSWORD`            | Neo4j database password                           |
| `GCS_BUCKET_NAME`           | Google Cloud Storage bucket name                  |
| `GOOGLE_CREDENTIALS_BASE64` | Base64-encoded Google Cloud credentials           |
| `SLACK_WEBHOOK_URL`         | Slack webhook URL for notifications               |
| `AUTH0_DOMAIN`              | Auth0 domain for server-side operations           |
| `AUTH0_CLIENT_ID`           | Auth0 client ID for server-side operations        |
| `SERVER_CONFIG_NAME`        | Server configuration name                         |

### Testing Variables

| Variable                      | Description                                  |
| ----------------------------- | -------------------------------------------- |
| `VITE_AUTH0_USERNAME`         | Test username for Auth0 in integration tests |
| `VITE_AUTH0_PASSWORD`         | Test password for Auth0 in integration tests |
| `VITE_AUTH0_USERNAME_2`       | Secondary test username for Auth0            |
| `VITE_AUTH0_PASSWORD_2`       | Secondary test password for Auth0            |

## Getting Started

1. Clone the repository
2. Ensure you are on Node ≥ 24.13.0 (`nvm use 24`)
3. Enable pnpm (this repo uses pnpm, pinned via the `packageManager` field): `corepack enable`
4. Copy `.env.example` to `.env` and update the values
5. Install dependencies with `pnpm install`
6. Start the development server with `pnpm run dev`
7. Run unit tests with `pnpm run test:unit` (Vitest) and end-to-end tests with `pnpm run test:playwright` (Playwright, mocked GraphQL)
8. Before committing, run `pnpm run verify` (type-check + unit tests); the pre-commit hook runs this plus ESLint automatically

## Testing Guidelines

### Testing Patterns

#### Unit Tests (Vitest)

We use Vitest with Vue Test Utils for component and utility testing. Unit tests should:

- Test one specific piece of functionality
- Mock external dependencies
- Focus on behavior, not implementation details
- Be fast and deterministic

**Component Test Structure:**

```typescript
// Import utilities and component
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import YourComponent from '@/components/YourComponent.vue';

describe('YourComponent', () => {
  // Test rendering
  it('renders correctly with default props', () => {
    const wrapper = mount(YourComponent);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Expected Text');
  });

  // Test props
  it('applies custom prop values correctly', () => {
    const wrapper = mount(YourComponent, {
      props: { title: 'Custom Title' },
    });
    expect(wrapper.text()).toContain('Custom Title');
  });

  // Test user interaction
  it('emits an event when button is clicked', async () => {
    const wrapper = mount(YourComponent);
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted()).toHaveProperty('custom-event');
  });

  // Test conditional rendering
  it('shows error message when validation fails', async () => {
    const wrapper = mount(YourComponent);
    await wrapper.find('input').setValue('invalid');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).toContain('Error message');
  });
});
```

#### End-to-End Tests (Playwright)

End-to-end tests use Playwright with **mocked GraphQL responses** (no backend
required). Tests should:

- Focus on user-centric workflows
- Test feature interactions
- Use `installMockAuth()` for programmatic authentication (faster and more
  reliable than driving the login UI)
- Leverage `data-testid` attributes for stable selectors
- Wait on network responses or UI state instead of arbitrary sleeps

**End-to-End Test Structure:**

```typescript
import { test, expect } from '@playwright/test';
import { installMockAuth } from '../support/auth';

test('completes a user workflow successfully', async ({ page }) => {
  await installMockAuth(page);

  await page.goto('/forums/cats');

  await page.getByTestId('create-discussion-button').click();
  await page.getByTestId('title-input').fill('Test Discussion');
  await page.getByTestId('body-input').fill('Test Body');

  // Wait for the actual GraphQL request to complete instead of a fixed timeout
  await Promise.all([
    page.waitForResponse((res) => res.url().includes('/graphql')),
    page.getByTestId('save-button').click(),
  ]);

  await expect(page.getByTestId('discussion-title')).toContainText(
    'Test Discussion'
  );
});
```

Run a single mocked spec with:

```bash
pnpm run test:playwright:mocked -- tests/playwright/mocked/discussions/createEditDeleteDiscussions.spec.ts
```

### Best Practices

#### Example: Testing a Form Component

```typescript
// FormComponent.spec.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FormComponent from '@/components/FormComponent.vue';

describe('FormComponent', () => {
  // Setup common test data
  const validInput = {
    name: 'Test User',
    email: 'test@example.com',
  };

  const mountComponent = (props = {}) => {
    return mount(FormComponent, {
      props: {
        initialValues: {},
        ...props,
      },
    });
  };

  it('validates required fields', async () => {
    const wrapper = mountComponent();

    // Submit empty form
    await wrapper.find('form').trigger('submit');

    // Check for validation messages
    expect(wrapper.text()).toContain('Name is required');
    expect(wrapper.text()).toContain('Email is required');
  });

  it('validates email format', async () => {
    const wrapper = mountComponent();

    // Input invalid email
    await wrapper.find('[data-testid="name-input"]').setValue('Test User');
    await wrapper.find('[data-testid="email-input"]').setValue('invalid-email');
    await wrapper.find('form').trigger('submit');

    // Check for validation message
    expect(wrapper.text()).toContain('Email format is invalid');
  });

  it('submits valid data and emits event', async () => {
    const wrapper = mountComponent();

    // Fill form with valid data
    await wrapper.find('[data-testid="name-input"]').setValue(validInput.name);
    await wrapper
      .find('[data-testid="email-input"]')
      .setValue(validInput.email);

    // Submit form
    await wrapper.find('form').trigger('submit');

    // Verify event emission
    expect(wrapper.emitted()).toHaveProperty('submit');
    expect(wrapper.emitted().submit[0][0]).toEqual(validInput);
  });
});
```

#### Example: Testing a Complex Workflow (Playwright)

```typescript
// tests/playwright/mocked/discussions/createEditDeleteDiscussions.spec.ts
import { test, expect } from '@playwright/test';
import { installMockAuth } from '../../support/auth';

test('creates, edits, and deletes a discussion', async ({ page }) => {
  await installMockAuth(page);

  // Create
  await page.goto('/forums/cats/discussions/create');
  await page.getByTestId('title-input').fill('Test Discussion');
  await page.getByTestId('body-input').fill('Initial content');
  await Promise.all([
    page.waitForResponse((res) => res.url().includes('/graphql')),
    page.getByTestId('save-button').click(),
  ]);
  await expect(page.getByTestId('discussion-title')).toContainText(
    'Test Discussion'
  );

  // Edit
  await page.getByTestId('discussion-menu-button').click();
  await page.getByTestId('discussion-menu-button-item-Edit').click();
  await page.getByTestId('body-input').fill('Updated content');
  await Promise.all([
    page.waitForResponse((res) => res.url().includes('/graphql')),
    page.getByTestId('save-button').click(),
  ]);
  await expect(page.getByTestId('discussion-body')).toContainText(
    'Updated content'
  );

  // Delete
  await page.getByTestId('discussion-menu-button').click();
  await page.getByTestId('discussion-menu-button-item-Delete').click();
  await page.getByTestId('confirm-delete-button').click();
  await expect(page).toHaveURL(/\/forums\/cats\/discussions/);
});
```

### Common Testing Pitfalls to Avoid

1. **Flaky Tests**
   - ❌ Don't use arbitrary timeouts: `await page.waitForTimeout(3000)`
   - ✅ Do wait for the actual network response or UI state: `page.waitForResponse(...)`, `await expect(locator).toBeVisible()`

2. **Brittle Selectors**
   - ❌ Don't use CSS classes that might change: `page.locator('.button-primary')`
   - ✅ Do use test ids: `page.getByTestId('save-button')`

3. **Testing Implementation Details**
   - ❌ Don't test internal component state: `expect(wrapper.vm.internalValue).toBe(true)`
   - ✅ Do test observable behavior: `expect(wrapper.text()).toContain('Error message')`

4. **Brittle Authentication Setup**
   - ❌ Don't drive the login UI in every test
   - ✅ Do authenticate programmatically with `installMockAuth(page)`

5. **Missing Network Request Handling**
   - ❌ Don't assume requests complete instantly
   - ✅ Do wait for the GraphQL response alongside the action that triggers it:
     ```typescript
     await Promise.all([
       page.waitForResponse((res) => res.url().includes('/graphql')),
       page.getByTestId('save-button').click(),
     ]);
     ```

6. **Overly Coupled Tests**
   - ❌ Don't create tests that depend on each other's state
   - ✅ Do create independent test cases with clear setup/teardown

7. **Testing Too Much in One Test**
   - ❌ Don't write lengthy tests covering multiple behaviors
   - ✅ Do create focused tests with clear assertions:
     ```typescript
     // Instead of one large test:
     it('validates email field');
     it('validates password field');
     it('allows submission with valid data');
     ```

8. **Inconsistent Mocking**
   - ❌ Don't partially mock dependencies
   - ✅ Do completely mock external dependencies or use real implementations

### Frontend testing patterns

These conventions keep tests fast, meaningful, and consistent with the rest of
the suite.

- **Colocate specs.** Put a unit spec next to the file it tests
  (`Foo.vue` → `Foo.spec.ts`, `foo.ts` → `foo.spec.ts`). Specs under `tests/unit`
  are also picked up.
- **Test real logic, not reimplementations.** When a component holds non-trivial
  logic (formatting, validation, derivation), extract it into a `utils/` function
  and unit-test that function directly. This is how the large components
  (`CreateEditEventFields`, `IssueDetail`, `CommentSection`, `Comment`) are
  tested — the pure rules live in tested utils and the component just calls them.
- **Test pages through their child components.** Most pages are thin wrappers.
  Use `shallowMount` + `findComponent(Child)` and assert the props the page
  passes down (or the events it forwards), rather than rendering the whole tree:

  ```typescript
  const search = shallowMount(DiscussionsIndexPage, {
    global: { stubs: { NuxtLayout: SlotRenderingStub } },
  }).findComponent(SearchDiscussions);
  expect(search.props('isForumScoped')).toBe(false);
  ```

  - Stub layout/slot wrappers (`NuxtLayout`, `FormRow`) with a component that
    renders the relevant slot, otherwise `shallowMount` swallows slot content.
  - For pages that call `definePageMeta`, add `vi.stubGlobal('definePageMeta', vi.fn())`.
- **Keep `vi.mock` at the module top level.** Vitest hoists `vi.mock` to the top
  of the file, so calling it inside `beforeEach`/`describe` is misleading and now
  triggers a deprecation warning. If the mock factory references local variables,
  prefix their names with `mock` (e.g. `mockThemeRef`) so Vitest allows the
  hoisted reference.
- **One assertion per `it`.** Prefer multiple focused `it` blocks or a single
  structured `expect` over several assertions in one test.
- **Mount the actual component, never a hand-written stand-in.** A spec that
  defines `const FooTest = { name: 'Foo', template: '...' }` and mounts *that*
  contributes **zero** coverage to `Foo.vue` and silently drifts from the real
  component. If a component is hard to mount, mock its dependencies (below) — do
  not reimplement it in the spec. (`CommentSection.spec.ts` was rewritten for
  exactly this reason.)
- **Mock Apollo at the module level for components that use it.** `mountWithDefaults`
  does not wire Apollo, so mock `@vue/apollo-composable` in the spec. To exercise
  a component's mutation callbacks, return a `mutate()` that synchronously fires
  its registered `onDone` handlers; return an empty `useQuery` result so
  query-backed composables resolve to their default state:

  ```typescript
  vi.mock('@vue/apollo-composable', async () => {
    const { ref } = await import('vue');
    return {
      useMutation: () => {
        const done: Array<(p: unknown) => void> = [];
        return {
          mutate: vi.fn(() => { done.forEach((cb) => cb({ data: {} })); }),
          onDone: (cb: (p: unknown) => void) => done.push(cb),
          onError: vi.fn(),
          loading: ref(false),
          error: ref(null),
        };
      },
      useQuery: () => ({ result: ref(null), loading: ref(false), error: ref(null), onResult: vi.fn(), onError: vi.fn() }),
    };
  });
  ```

- **Seed hoisted mock factories with the *full* return shape.** A mock typed by
  its initial implementation narrows the return type, so a later
  `mockReturnValue` with extra fields fails the typecheck. CI's `vue-tsc` job
  catches this even when the test passes locally, so seed every field up front:

  ```typescript
  // ❌ inferred return type is { valid: boolean } — a later
  //    mockReturnValue({ valid: false, message }) fails vue-tsc (TS2353)
  const isFileSizeValid = vi.fn(() => ({ valid: true }));
  // ✅ seed the full shape
  const isFileSizeValid = vi.fn(() => ({ valid: true, message: '' }));
  ```

- **`@/utils` and `@/utils/index` are the same module.** If you `vi.mock` one,
  mock both with every export the code under test imports — otherwise the second
  mock silently overrides the first and drops exports.
- **Teleported UI renders into `document.body`, not the wrapper.** Tooltips and
  modals using `<Teleport to="body">` are outside the component subtree; assert
  with `document.body.querySelector(...)` rather than `wrapper.find(...)`.
- **Mocked GraphQL entities need `__typename`.** Apollo normalizes by
  `__typename` + key field; a mock entity without `__typename` reaches the
  component as just its key field (e.g. a channel arrives with only `uniqueName`).
  This applies to both Apollo unit mocks and the Playwright GraphQL fixtures.

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils Documentation](https://test-utils.vuejs.org/)
- [Playwright Documentation](https://playwright.dev/)
- Check out existing tests in the codebase for practical examples
