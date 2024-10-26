// plugins/auth0.client.ts
import { createAuth0 } from "@auth0/auth0-vue";
import { defineNuxtPlugin } from "#app";

export default defineNuxtPlugin((nuxtApp) => {
  const auth0 = createAuth0({
    domain: process.env.VITE_AUTH0_DOMAIN,
    clientId: process.env.VITE_AUTH0_CLIENT_ID,
    authorizationParams: {
      redirect_uri: process.env.VITE_AUTH0_CALLBACK_URL,
    },
  });

  nuxtApp.vueApp.use(auth0);
});
