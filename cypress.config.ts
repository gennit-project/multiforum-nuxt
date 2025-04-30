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
});