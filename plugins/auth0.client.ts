// plugins/auth0.client.ts
import { createAuth0 } from "@auth0/auth0-vue";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public;
  console.log("config in auth0 plugin ", config);

  const createAuth0options = {
    domain: config.auth0Domain,
    clientId: config.auth0ClientId,
    authorizationParams: {
      audience: config.auth0Audience,
      redirect_uri: config.auth0CallbackUrl,
    },
  };
  console.log("createAuth0options", createAuth0options);

  const auth0 = createAuth0(createAuth0options);

  nuxtApp.vueApp.use(auth0);
});
