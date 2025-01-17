// plugins/auth0.client.ts
import { createAuth0 } from "@auth0/auth0-vue";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public;

  const createAuth0options = {
    domain: config.auth0Domain,
    clientId: config.auth0ClientId,
    authorizationParams: {
      audience: config.auth0Audience,
      redirect_uri: config.auth0CallbackUrl,
      prompt: "select_account",
    },
  };

  const auth0 = createAuth0(createAuth0options);

  nuxtApp.vueApp.use(auth0);
});
