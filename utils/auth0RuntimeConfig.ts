export const DORMANT_AUTH0_CONFIG = {
  domain: 'multiforum-auth-disabled.invalid',
  clientId: 'not-configured',
  clientSecret: 'not-configured',
  sessionSecret: 'not-configured-not-configured-not-configured',
} as const;

type Auth0RuntimeConfig = {
  domain?: unknown;
  clientId?: unknown;
  clientSecret?: unknown;
  sessionSecret?: unknown;
};

const requiredAuth0Fields = [
  'domain',
  'clientId',
  'clientSecret',
  'sessionSecret',
] as const;

export const getMissingAuth0RuntimeFields = ({
  authProvider,
  auth0,
}: {
  authProvider: unknown;
  auth0: Auth0RuntimeConfig;
}): string[] => {
  if (authProvider !== 'auth0') return [];

  return requiredAuth0Fields.filter((field) => {
    const value = auth0[field];
    return (
      typeof value !== 'string' ||
      !value.trim() ||
      value === DORMANT_AUTH0_CONFIG[field]
    );
  });
};
