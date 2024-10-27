// plugins/auth0.client.ts
import { createAuth0 } from "@auth0/auth0-vue";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public;
  
  const auth0 = createAuth0({
    domain: config.auth0Domain,
    clientId: config.auth0ClientId,
    authorizationParams: {
      redirect_uri: config.auth0CallbackUrl,
    },
  });

  nuxtApp.vueApp.use(auth0);
});
