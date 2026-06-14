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
  }: { username?: string; email?: string } = {}
) {
  const token = createMockJwt(email, username);

  await context.addCookies([
    {
      name: 'auth-hint',
      value: 'true',
      url: 'http://127.0.0.1:3100',
      httpOnly: false,
      sameSite: 'Lax',
      secure: false,
    },
    {
      name: 'username-hint',
      value: username,
      url: 'http://127.0.0.1:3100',
      httpOnly: false,
      sameSite: 'Lax',
      secure: false,
    },
  ]);

  await page.addInitScript(
    ({ token, username }) => {
      window.localStorage.setItem('token', token);
      window.localStorage.setItem('mock_username', username);
      window.localStorage.setItem(
        'auth_token_cache',
        JSON.stringify({
          accessToken: token,
          expiresAt: Date.now() + 60 * 60 * 1000,
        })
      );
    },
    { token, username }
  );

  return token;
}
