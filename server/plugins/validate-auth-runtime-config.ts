import { getMissingAuth0RuntimeFields } from '@/utils/auth0RuntimeConfig';

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig();
  const missing = getMissingAuth0RuntimeFields({
    authProvider: config.public.authProvider,
    auth0: config.auth0,
  });

  if (missing.length) {
    throw new Error(
      `Auth0 runtime configuration is missing: ${missing.join(', ')}`
    );
  }
});
