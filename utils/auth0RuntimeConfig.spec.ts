import { describe, expect, it } from 'vitest';

import {
  DORMANT_AUTH0_CONFIG,
  getMissingAuth0RuntimeFields,
} from '@/utils/auth0RuntimeConfig';

describe('getMissingAuth0RuntimeFields', () => {
  it('does not require Auth0 credentials in local development mode', () => {
    expect(
      getMissingAuth0RuntimeFields({
        authProvider: 'local-dev',
        auth0: DORMANT_AUTH0_CONFIG,
      })
    ).toEqual([]);
  });

  it('accepts a fully configured Auth0 deployment', () => {
    expect(
      getMissingAuth0RuntimeFields({
        authProvider: 'auth0',
        auth0: {
          domain: 'tenant.auth0.com',
          clientId: 'client-id',
          clientSecret: 'client-secret',
          sessionSecret: 'a-unique-session-secret-with-enough-entropy',
        },
      })
    ).toEqual([]);
  });

  it('reports dormant placeholder values in Auth0 mode', () => {
    expect(
      getMissingAuth0RuntimeFields({
        authProvider: 'auth0',
        auth0: DORMANT_AUTH0_CONFIG,
      })
    ).toEqual(['domain', 'clientId', 'clientSecret', 'sessionSecret']);
  });

  it('reports empty and non-string Auth0 values', () => {
    expect(
      getMissingAuth0RuntimeFields({
        authProvider: 'auth0',
        auth0: {
          domain: ' ',
          clientId: null,
          clientSecret: 'client-secret',
          sessionSecret: 'session-secret',
        },
      })
    ).toEqual(['domain', 'clientId']);
  });
});
