import { describe, expect, it } from 'vitest';
import {
  buildLoginUrl,
  buildLogoutUrl,
  normalizeAuthProvider,
} from './useAuthNavigation';

describe('auth navigation', () => {
  it.each([
    ['local-dev', 'local-dev'],
    ['auth0', 'auth0'],
    ['unexpected', 'auth0'],
    [undefined, 'auth0'],
  ] as const)('normalizes %s to %s', (value, expected) => {
    expect(normalizeAuthProvider(value)).toBe(expected);
  });

  it('builds a local sign-in URL with an encoded return path', () => {
    expect(
      buildLoginUrl({ provider: 'local-dev', returnTo: '/forums/cats?tab=new' })
    ).toBe('/login?returnTo=%2Fforums%2Fcats%3Ftab%3Dnew');
  });

  it('preserves the Auth0 login route by default', () => {
    expect(buildLoginUrl({ provider: 'auth0', returnTo: '/' })).toBe(
      '/auth/login?returnTo=%2F'
    );
  });

  it.each([
    ['local-dev', '/auth/local-dev/logout'],
    ['auth0', '/auth/logout'],
  ] as const)('builds the %s logout route', (provider, expected) => {
    expect(buildLogoutUrl(provider)).toBe(expected);
  });
});
