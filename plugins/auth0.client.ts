// plugins/auth0.client.ts
import { createAuth0, type Auth0VueClientOptions } from "@auth0/auth0-vue";
import { defineNuxtPlugin, useRuntimeConfig } from "nuxt/app";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public;
  const { auth0Domain, auth0ClientId, auth0Audience, auth0CallbackUrl } = config;

  const createAuth0options: Auth0VueClientOptions = {
    domain: auth0Domain as string,
    clientId: auth0ClientId as string,
    authorizationParams: {
      audience: auth0Audience as string,
      redirect_uri: auth0CallbackUrl as string,
      prompt: "select_account",
    },
    cacheLocation: "localstorage" as const,
    useRefreshTokens: true,
  };

  const auth0 = createAuth0(createAuth0options);

  nuxtApp.vueApp.use(auth0);
});
