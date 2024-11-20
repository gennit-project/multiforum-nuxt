import { defineConfig } from "cypress";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

export default defineConfig({
  includeShadowDom: true,
  e2e: {
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      on('before:run', async () => {
        console.log('🔍 Initializing test environment checks...');
      });
    },
    supportFile: 'cypress/support/e2e.ts'
  },
  video: false,
});