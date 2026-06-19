// plugins/apollo-auth.client.ts
//
// SPIKE (auth0-nuxt server-session migration) — Phase 2.
//
// @nuxtjs/apollo (v5 alpha) builds its own Apollo link and resolves the auth
// token in this order (see node_modules/@nuxtjs/apollo/dist/runtime/plugin.js):
//   1. await nuxtApp.callHook('apollo:auth', { token, client })  ← THIS hook
//   2. else read tokenStorage (cookie / localStorage 'token')
// The `apolloLink` option in nuxt.config is NOT consumed by this version, so
// the only supported way to inject a custom token is this hook.
//
// We supply the access token from the server session (server/api/auth/token),
// so GraphQL is authenticated from the encrypted session cookie instead of a
// localStorage token written by the SPA SDK. The module prepends the configured
// authType ("Bearer "), so we set the raw JWT.
import { defineNuxtPlugin } from 'nuxt/app';

export default defineNuxtPlugin((nuxtApp) => {
  // Cache the token briefly so we don't hit /api/auth/token on every GraphQL
  // request (the hook fires once per operation via the link's setContext).
  let cachedToken: string | null = null;
  let cachedAt = 0;
  const TOKEN_TTL_MS = 60_000;

  const fetchSessionToken = async (): Promise<string | null> => {
    if (cachedToken && Date.now() - cachedAt < TOKEN_TTL_MS) {
      return cachedToken;
    }
    try {
      const res = await fetch('/api/auth/token', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const { accessToken } = (await res.json()) as {
        accessToken: string | null;
      };
      cachedToken = accessToken;
      cachedAt = Date.now();
      return accessToken;
    } catch {
      return null;
    }
  };

  // @nuxtjs/apollo awaits this hook before falling back to tokenStorage.
  nuxtApp.hook(
    'apollo:auth',
    async ({ token }: { token: { value: string | null }; client: string }) => {
      const sessionToken = await fetchSessionToken();
      if (sessionToken) {
        token.value = sessionToken;
      }
    }
  );
});
