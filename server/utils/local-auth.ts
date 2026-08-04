export const LOCAL_AUTH_PROVIDER = 'local-dev';
export const LOCAL_AUTH_COOKIE = 'multiforum-local-token';

type LocalAuthRuntimeConfig = {
  backendGraphqlUrl?: string;
  localAuthTokenEndpoint?: string;
  public?: {
    authProvider?: string;
    apollo?: {
      clients?: {
        default?: {
          httpEndpoint?: string;
        };
      };
    };
  };
};

export const isLocalDevAuth = (config: LocalAuthRuntimeConfig) =>
  config.public?.authProvider === LOCAL_AUTH_PROVIDER;

export const getServerGraphqlUrl = (config: LocalAuthRuntimeConfig): string =>
  config.backendGraphqlUrl?.trim() ||
  config.public?.apollo?.clients?.default?.httpEndpoint?.trim() ||
  '';

export const getLocalAuthTokenEndpoint = (
  config: LocalAuthRuntimeConfig
): string => {
  const configured = config.localAuthTokenEndpoint?.trim();
  if (configured) return configured;

  const graphqlUrl = getServerGraphqlUrl(config);
  if (!graphqlUrl) return '';

  try {
    return new URL('/auth/local-dev/token', graphqlUrl).toString();
  } catch {
    return '';
  }
};
