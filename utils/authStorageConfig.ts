const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const PROFILE_CACHE_TTL_MS = 60 * 60 * 1000;

type AuthStorageConfigOptions = {
  nitroPreset: string | undefined;
  dataDir?: string;
};

export const getAuthStorageConfig = ({
  nitroPreset,
  dataDir = '.data',
}: AuthStorageConfigOptions) => {
  if (nitroPreset === 'node-server') {
    return {
      auth0Sessions: {
        driver: 'fs' as const,
        base: `${dataDir}/auth0-sessions`,
      },
      authProfileCache: {
        driver: 'lru-cache' as const,
        max: 1000,
        ttl: PROFILE_CACHE_TTL_MS,
      },
    };
  }

  return {
    auth0Sessions: {
      driver: 'upstash' as const,
      base: 'auth0Sessions',
      ttl: SESSION_TTL_SECONDS,
    },
    authProfileCache: {
      driver: 'upstash' as const,
      base: 'authProfileCache',
    },
  };
};
