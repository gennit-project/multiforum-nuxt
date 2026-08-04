import { describe, expect, it } from 'vitest';
import {
  getLocalAuthTokenEndpoint,
  getServerGraphqlUrl,
  isLocalDevAuth,
} from './local-auth';

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

  it('uses the private backend URL for server-side GraphQL requests', () => {
    expect(
      getServerGraphqlUrl({
        backendGraphqlUrl: ' http://backend:4000 ',
        public: {
          apollo: {
            clients: {
              default: { httpEndpoint: 'http://localhost:4000' },
            },
          },
        },
      })
    ).toBe('http://backend:4000');
  });

  it('falls back to the public GraphQL URL outside container networks', () => {
    expect(
      getServerGraphqlUrl({
        public: {
          apollo: {
            clients: {
              default: { httpEndpoint: ' http://localhost:4000 ' },
            },
          },
        },
      })
    ).toBe('http://localhost:4000');
  });

  it('derives local auth from the private backend URL when available', () => {
    expect(
      getLocalAuthTokenEndpoint({
        backendGraphqlUrl: 'http://backend:4000/graphql',
        public: {
          apollo: {
            clients: {
              default: { httpEndpoint: 'http://localhost:4000/graphql' },
            },
          },
        },
      })
    ).toBe('http://backend:4000/auth/local-dev/token');
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
