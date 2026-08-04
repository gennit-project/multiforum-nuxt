import { describe, expect, it } from 'vitest';
import { getLocalAuthTokenEndpoint, isLocalDevAuth } from './local-auth';

describe('local auth server configuration', () => {
  it('recognizes only the explicit local development provider', () => {
    expect(isLocalDevAuth({ public: { authProvider: 'local-dev' } })).toBe(
      true
    );
  });

  it('uses an explicit token endpoint when configured', () => {
    expect(
      getLocalAuthTokenEndpoint({
        localAuthTokenEndpoint: ' http://backend:4000/custom-token ',
      })
    ).toBe('http://backend:4000/custom-token');
  });

  it('derives the token endpoint from the GraphQL origin', () => {
    expect(
      getLocalAuthTokenEndpoint({
        public: {
          apollo: {
            clients: {
              default: { httpEndpoint: 'http://backend:4000/graphql' },
            },
          },
        },
      })
    ).toBe('http://backend:4000/auth/local-dev/token');
  });

  it.each([undefined, '', 'not a url'])(
    'rejects an unusable GraphQL URL',
    (url) => {
      expect(
        getLocalAuthTokenEndpoint({
          public: { apollo: { clients: { default: { httpEndpoint: url } } } },
        })
      ).toBe('');
    }
  );
});
