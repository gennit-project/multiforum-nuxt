import { defineConfig } from "cypress";
// Populate process.env with values from .env file
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config({ path: ".env" });

module.exports = defineConfig({
  env: {
    auth0_username: process.env.VITE_AUTH0_USERNAME,
    auth0_password: process.env.VITE_AUTH0_PASSWORD,
    auth0_username_2: process.env.VITE_AUTH0_USERNAME_2,
    auth0_password_2: process.env.VITE_AUTH0_PASSWORD_2,
    auth0_domain: process.env.VITE_AUTH0_DOMAIN,
    auth0_url: process.env.VITE_AUTH0_URL,
    auth0_audience: process.env.VITE_AUTH0_AUDIENCE,
    auth0_scope: process.env.VITE_AUTH0_SCOPE,
    auth0_client_id: process.env.VITE_AUTH0_CLIENT_ID,
    auth0_client_secret: process.env.VITE_AUTH0_CLIENT_SECRET,
  },
  "includeShadowDom": true,
  e2e: {
    setupNodeEvents(/*on, config*/) {
      // implement node event listeners here
    },
  },
  video: false,
});
