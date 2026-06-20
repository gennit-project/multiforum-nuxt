import type { BrowserContext, Page } from '@playwright/test';

export function createMockJwt(
  email: string,
  username = email === 'catherine.luse@gmail.com' ? 'cluse' : undefined
) {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');

  const now = Math.floor(Date.now() / 1000);

  return [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({
      email,
      username,
      exp: now + 60 * 60,
      iat: now,
      sub: `playwright|${email}`,
    }),
    'mock-signature',
  ].join('.');
}

export async function installMockAuth(
  context: BrowserContext,
  page: Page,
  {
    username = 'cluse',
    email = 'catherine.luse@gmail.com',
    modProfileName = '',
  }: { username?: string; email?: string; modProfileName?: string } = {}
) {
  const token = createMockJwt(email, username);
  const frontendPort = process.env.PLAYWRIGHT_FRONTEND_PORT ?? '3100';
  const cookieURL = `http://127.0.0.1:${frontendPort}`;

  // The server-session model resolves auth on the server. There is no real
  // Auth0 session in mocked runs, so we hand the seeded profile to the server
  // via a `mock-auth` cookie that server/middleware/2.auth-session.ts decodes
  // (gated on VITE_E2E_MOCK_MODE). This drives the SAME SSR seeding path as
  // production, so SSR and client hydrate to the same authenticated state.
  const mockAuth = Buffer.from(
    JSON.stringify({ username, email, modProfileName })
  ).toString('base64');

  await context.addCookies([
    {
      name: 'mock-auth',
      value: mockAuth,
      url: cookieURL,
      httpOnly: false,
      sameSite: 'Lax',
      secure: false,
    },
  ]);

  await page.addInitScript(
    ({ token, username, modProfileName }) => {
      window.localStorage.setItem('token', token);
      window.localStorage.setItem('mock_username', username);
      if (modProfileName) {
        window.localStorage.setItem('mock_mod_profile_name', modProfileName);
      }
      window.localStorage.setItem(
        'auth_token_cache',
        JSON.stringify({
          accessToken: token,
          expiresAt: Date.now() + 60 * 60 * 1000,
        })
      );
    },
    { token, username, modProfileName }
  );

  return token;
}
