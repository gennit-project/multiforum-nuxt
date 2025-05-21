# Contributing to Multiforum

This guide will help you contribute to the Multiforum codebase, with a focus on testing practices.

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
| `CYPRESS_ADMIN_TEST_EMAIL`    | Admin email for Cypress tests                |
| `CYPRESS_ADMIN_TEST_USERNAME` | Admin username for Cypress tests             |

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and update the values
3. Install dependencies with `npm install`
4. Start the development server with `npm run dev`
5. Run tests with `npm run test` (Cypress) or `npm run test:unit` (Vitest)

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
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import YourComponent from "@/components/YourComponent.vue";

describe("YourComponent", () => {
  // Test rendering
  it("renders correctly with default props", () => {
    const wrapper = mount(YourComponent);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain("Expected Text");
  });

  // Test props
  it("applies custom prop values correctly", () => {
    const wrapper = mount(YourComponent, {
      props: { title: "Custom Title" },
    });
    expect(wrapper.text()).toContain("Custom Title");
  });

  // Test user interaction
  it("emits an event when button is clicked", async () => {
    const wrapper = mount(YourComponent);
    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted()).toHaveProperty("custom-event");
  });

  // Test conditional rendering
  it("shows error message when validation fails", async () => {
    const wrapper = mount(YourComponent);
    await wrapper.find("input").setValue("invalid");
    await wrapper.find("form").trigger("submit");
    expect(wrapper.text()).toContain("Error message");
  });
});
```

#### Integration Tests (Cypress)

Integration tests use Cypress to test full user flows. Tests should:

- Focus on user-centric workflows
- Test feature interactions
- Use real API calls (selectively mocked when needed)
- Leverage data-testid attributes for stable selectors

**Integration Test Structure:**

```typescript
import { setupTestData, loginUser } from "../../support/testSetup";

describe("Feature workflow", () => {
  // Set up data once for the entire test file
  setupTestData();

  // Authenticate before each test
  loginUser("loginWithCreateEventButton");

  it("completes a user workflow successfully", () => {
    // Set up request interception for GraphQL calls
    cy.intercept("POST", "**/graphql").as("graphqlRequest");

    // Navigate to the starting point
    cy.visit("/forums/cats");

    // Interact with the UI
    cy.get('[data-testid="create-discussion-button"]').click();
    cy.get('[data-testid="title-input"]').type("Test Discussion");
    cy.get('[data-testid="body-input"]').type("Test Body");

    // Submit the form and wait for network request
    cy.get('[data-testid="save-button"]').click();
    cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);

    // Verify the expected outcome
    cy.get('[data-testid="discussion-title"]').should("contain", "Test Discussion");
  });
});
```

### Best Practices

#### Example: Testing a Form Component

```typescript
// FormComponent.spec.ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import FormComponent from "@/components/FormComponent.vue";

describe("FormComponent", () => {
  // Setup common test data
  const validInput = {
    name: "Test User",
    email: "test@example.com",
  };

  const mountComponent = (props = {}) => {
    return mount(FormComponent, {
      props: {
        initialValues: {},
        ...props,
      },
    });
  };

  it("validates required fields", async () => {
    const wrapper = mountComponent();

    // Submit empty form
    await wrapper.find("form").trigger("submit");

    // Check for validation messages
    expect(wrapper.text()).toContain("Name is required");
    expect(wrapper.text()).toContain("Email is required");
  });

  it("validates email format", async () => {
    const wrapper = mountComponent();

    // Input invalid email
    await wrapper.find('[data-testid="name-input"]').setValue("Test User");
    await wrapper.find('[data-testid="email-input"]').setValue("invalid-email");
    await wrapper.find("form").trigger("submit");

    // Check for validation message
    expect(wrapper.text()).toContain("Email format is invalid");
  });

  it("submits valid data and emits event", async () => {
    const wrapper = mountComponent();

    // Fill form with valid data
    await wrapper.find('[data-testid="name-input"]').setValue(validInput.name);
    await wrapper.find('[data-testid="email-input"]').setValue(validInput.email);

    // Submit form
    await wrapper.find("form").trigger("submit");

    // Verify event emission
    expect(wrapper.emitted()).toHaveProperty("submit");
    expect(wrapper.emitted().submit[0][0]).toEqual(validInput);
  });
});
```

#### Example: Testing a Complex Workflow (Cypress)

```typescript
// createEditDeleteDiscussions.spec.cy.ts
import { setupTestData, loginUser } from "../../support/testSetup";
import { DISCUSSION_CREATION_FORM } from "../constants";

describe("Discussion CRUD operations", () => {
  setupTestData();
  loginUser("loginWithCreateEventButton");

  it("creates, edits, and deletes a discussion", () => {
    // Set up GraphQL interception
    cy.intercept("POST", "**/graphql", (req) => {
      if (req.body.query.includes("createDiscussion")) {
        req.alias = "createDiscussionRequest";
      } else if (req.body.query.includes("updateDiscussion")) {
        req.alias = "updateDiscussionRequest";
      } else if (req.body.query.includes("deleteDiscussion")) {
        req.alias = "deleteDiscussionRequest";
      }
    });

    // Create discussion
    cy.visit(DISCUSSION_CREATION_FORM);
    cy.get('[data-testid="title-input"]').type("Test Discussion");
    cy.get('[data-testid="body-input"]').type("Initial content");
    cy.get('[data-testid="channel-input"]').type("cats{enter}");
    cy.get('[data-testid="save-button"]').click();
    cy.wait("@createDiscussionRequest").its("response.statusCode").should("eq", 200);
    cy.get('[data-testid="discussion-title"]').should("contain", "Test Discussion");

    // Edit discussion
    cy.get('[data-testid="discussion-menu-button"]').click();
    cy.get('[data-testid="discussion-menu-button-item-Edit"]').click();
    cy.get('[data-testid="body-input"]').clear().type("Updated content");
    cy.get('[data-testid="save-button"]').click();
    cy.wait("@updateDiscussionRequest").its("response.statusCode").should("eq", 200);
    cy.get('[data-testid="discussion-body"]').should("contain", "Updated content");

    // Delete discussion
    cy.get('[data-testid="discussion-menu-button"]').click();
    cy.get('[data-testid="discussion-menu-button-item-Delete"]').click();
    cy.get('[data-testid="confirm-delete-button"]').click();
    cy.wait("@deleteDiscussionRequest").its("response.statusCode").should("eq", 200);
    cy.url().should("include", "/forums/cats/discussions");
  });
});
```

### Common Testing Pitfalls to Avoid

1. **Flaky Tests**

   - ❌ Don't use arbitrary timeouts: `cy.wait(3000)`
   - ✅ Do wait for specific network requests or UI elements: `cy.wait('@graphqlRequest')`, `cy.get('.element').should('be.visible')`

2. **Brittle Selectors**

   - ❌ Don't use CSS classes that might change: `cy.get('.button-primary')`
   - ✅ Do use data-testid attributes: `cy.get('[data-testid="save-button"]')`

3. **Testing Implementation Details**

   - ❌ Don't test internal component state: `expect(wrapper.vm.internalValue).toBe(true)`
   - ✅ Do test observable behavior: `expect(wrapper.text()).toContain('Error message')`

4. **Inefficient Test Setup**

   - ❌ Don't reset database for each test
   - ✅ Do use `setupTestData()` to initialize once per file

5. **Missing Network Request Handling**

   - ❌ Don't assume requests complete instantly
   - ✅ Do intercept and wait for network requests to complete:
     ```typescript
     cy.intercept("POST", "**/graphql").as("graphqlRequest");
     cy.get("button").click();
     cy.wait("@graphqlRequest").its("response.statusCode").should("eq", 200);
     ```

6. **Overly Coupled Tests**

   - ❌ Don't create tests that depend on each other's state
   - ✅ Do create independent test cases with clear setup/teardown

7. **Testing Too Much in One Test**

   - ❌ Don't write lengthy tests covering multiple behaviors
   - ✅ Do create focused tests with clear assertions:
     ```typescript
     // Instead of one large test:
     it("validates email field");
     it("validates password field");
     it("allows submission with valid data");
     ```

8. **Inconsistent Mocking**
   - ❌ Don't partially mock dependencies
   - ✅ Do completely mock external dependencies or use real implementations

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils Documentation](https://test-utils.vuejs.org/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- Check out existing tests in the codebase for practical examples
