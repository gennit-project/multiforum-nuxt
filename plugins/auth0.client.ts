import {
  createAuth0,
  type Auth0VueClientOptions,
  useAuth0,
} from '@auth0/auth0-vue';
import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public;
  const { auth0Domain, auth0ClientId, auth0Audience, auth0CallbackUrl } =
    config;

  const createAuth0options: Auth0VueClientOptions = {
    domain: auth0Domain as string,
    clientId: auth0ClientId as string,
    authorizationParams: {
      audience: auth0Audience as string,
      redirect_uri: auth0CallbackUrl as string,
      prompt: 'select_account',
    },
    cacheLocation: 'localstorage',
    useRefreshTokens: true,
  };

  // ① Install the Auth0 Vue plugin
  const auth0 = createAuth0(createAuth0options);
  nuxtApp.vueApp.use(auth0);

  // ② Immediately access the composable (works after .use)
  const { getAccessTokenSilently } = useAuth0();

  // ③ Expose a helper for code that runs outside Vue’s setup()/script setup
  (globalThis as any).__auth0_getToken = (
    options: Parameters<typeof getAccessTokenSilently>[0] = {}
  ) => getAccessTokenSilently({ detailedResponse: false, ...options });
});
