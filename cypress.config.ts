import { defineConfig } from "cypress";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

export default defineConfig({
  includeShadowDom: true,
  e2e: {
    experimentalRunAllSpecs: true,
    setupNodeEvents(on) {
      on('before:run', async () => {
        console.log('🔍 Initializing test environment checks...');
      });
    },
    supportFile: 'tests/cypress/support/e2e.ts',
    specPattern: 'tests/cypress/e2e/**/*.spec.cy.ts'
  },
  video: false,
  env: {
    // Auth environment variables for session caching
    auth0Domain: process.env.AUTH0_DOMAIN || process.env.VITE_AUTH0_DOMAIN,
    auth0Username: process.env.VITE_AUTH0_USERNAME,
    auth0Password: process.env.VITE_AUTH0_PASSWORD,
    auth0Email: process.env.VITE_AUTH0_USERNAME, // If email is the same as username
    auth0ClientId: process.env.AUTH0_CLIENT_ID || process.env.VITE_AUTH0_CLIENT_ID,
    auth0ClientSecret: process.env.VITE_AUTH0_CLIENT_SECRET,
    auth0Audience: process.env.VITE_AUTH0_AUDIENCE || 'https://gennit.us.auth0.com/api/v2/',
    adminUsername: process.env.CYPRESS_ADMIN_TEST_USERNAME,
    adminEmail: process.env.CYPRESS_ADMIN_TEST_EMAIL,
    // Support existing env variables used in commands.ts
    email: process.env.VITE_AUTH0_USERNAME,
    password: process.env.VITE_AUTH0_PASSWORD,
    // Other cypress variables
    graphqlUrl: process.env.VITE_GRAPHQL_URL,
    baseUrl: process.env.VITE_BASE_URL || 'http://localhost:3000'
  }
});