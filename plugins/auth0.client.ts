// plugins/auth0.client.ts
import { createAuth0, type Auth0VueClientOptions } from "@auth0/auth0-vue";
import { defineNuxtPlugin, useRuntimeConfig } from "nuxt/app";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public;

  const createAuth0options: Auth0VueClientOptions = {
    domain: config.auth0Domain,
    clientId: config.auth0ClientId,
    authorizationParams: {
      audience: config.auth0Audience,
      redirect_uri: config.auth0CallbackUrl,
      prompt: "select_account",
    },
    cacheLocation: "localstorage" as const,
    useRefreshTokens: true,
  };

  const auth0 = createAuth0(createAuth0options);

  nuxtApp.vueApp.use(auth0);
});
