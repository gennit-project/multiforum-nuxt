import { describe, expect, it } from 'vitest';
import { getAuthStorageConfig } from '@/utils/authStorageConfig';

describe('getAuthStorageConfig', () => {
  it.each([
    [
      { nitroPreset: 'node-server' },
      {
        auth0Sessions: {
          driver: 'fs',
          base: '.data/auth0-sessions',
        },
        authProfileCache: {
          driver: 'lru-cache',
          max: 1000,
          ttl: 3_600_000,
        },
      },
    ],
    [
      { nitroPreset: 'node-server', dataDir: '/app/data' },
      {
        auth0Sessions: {
          driver: 'fs',
          base: '/app/data/auth0-sessions',
        },
        authProfileCache: {
          driver: 'lru-cache',
          max: 1000,
          ttl: 3_600_000,
        },
      },
    ],
    [
      { nitroPreset: 'vercel' },
      {
        auth0Sessions: {
          driver: 'upstash',
          base: 'auth0Sessions',
          ttl: 2_592_000,
        },
        authProfileCache: {
          driver: 'upstash',
          base: 'authProfileCache',
        },
      },
    ],
    [
      { nitroPreset: undefined },
      {
        auth0Sessions: {
          driver: 'upstash',
          base: 'auth0Sessions',
          ttl: 2_592_000,
        },
        authProfileCache: {
          driver: 'upstash',
          base: 'authProfileCache',
        },
      },
    ],
  ])('returns the expected mounts for options %o', (options, expected) => {
    expect(getAuthStorageConfig(options)).toEqual(expected);
  });
});
