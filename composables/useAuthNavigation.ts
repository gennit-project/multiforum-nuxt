import { useRuntimeConfig } from 'nuxt/app';

export type AuthProvider = 'auth0' | 'local-dev';

export const normalizeAuthProvider = (provider: unknown): AuthProvider =>
  provider === 'local-dev' ? 'local-dev' : 'auth0';

export const buildLoginUrl = ({
  provider,
  returnTo,
}: {
  provider: AuthProvider;
  returnTo: string;
}) => {
  const path = provider === 'local-dev' ? '/login' : '/auth/login';
  return `${path}?returnTo=${encodeURIComponent(returnTo)}`;
};

export const buildLogoutUrl = (provider: AuthProvider) =>
  provider === 'local-dev' ? '/auth/local-dev/logout' : '/auth/logout';

export const useAuthNavigation = () => {
  const config = useRuntimeConfig();
  const provider = normalizeAuthProvider(config.public.authProvider);

  return {
    provider,
    getLoginUrl: (returnTo: string) => buildLoginUrl({ provider, returnTo }),
    logoutUrl: buildLogoutUrl(provider),
  };
};
