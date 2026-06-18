// plugins/auth-session.ts
//
// SPIKE (auth0-nuxt server-session migration) — Phase 1 core.
//
// This is the change that makes SSR auth-aware and eliminates the whole class
// of auth hydration mismatches. With the server-session SDK, the server knows
// who the user is *before* it renders, so we can:
//   1. seed the reactive auth vars (usernameVar / isAuthenticatedVar) on the
//      server so SSR renders authenticated content, and
//   2. transfer that exact state to the client via the Nuxt payload (useState),
//      so the client's first hydration render matches the server (no mismatch).
//
// This is a UNIVERSAL plugin on purpose: the server branch reads the session
// and writes the payload; the (no-op-on-server) tail runs on BOTH sides and
// seeds the reactive vars — on the client it reads the value back out of the
// payload before the first render. A `.server.ts` plugin would not run on the
// client, so the client would never re-seed and we'd be back to a mismatch.
//
// It replaces the guesswork in plugins/auth0.server.ts (which decodes a cookie
// the localStorage SPA SDK never sets) and removes the need for the auth-hint
// cookie shim (useSSRAuth) and the username-cache.client.ts plugin.
//
// NOTE: modProfileName still comes from the GraphQL user fetch (useAuthManager)
// and remains async/post-mount — it is '' on both server and client at initial
// render, so it does not cause a mismatch. Only username/isAuthenticated need
// to be SSR-consistent, which is what this plugin guarantees.
import { defineNuxtPlugin, useState } from 'nuxt/app';
import { setUsername, setIsAuthenticated } from '@/cache';

type SeededAuth = {
  username: string;
  isAuthenticated: boolean;
};

export default defineNuxtPlugin(async (nuxtApp) => {
  // useState is SSR-serialized: written on the server, read on the client from
  // the payload — the transport that keeps both sides in sync.
  const seeded = useState<SeededAuth>('auth-session', () => ({
    username: '',
    isAuthenticated: false,
  }));

  if (import.meta.server) {
    const event = nuxtApp.ssrContext?.event;
    if (event) {
      try {
        // @ts-expect-error useAuth0 is auto-imported by @auth0/auth0-nuxt in
        // the Nitro/server context; types resolve once the module's types are
        // generated (post-`nuxi prepare`).
        const session = await useAuth0(event).getSession();
        const user = session?.user;
        if (user) {
          // The app keys auth UI off `username`. Auth0 stores the app username
          // in a custom claim; adjust the claim name to match the Auth0 Action
          // that sets it (see spike doc). Fall back to standard claims for the
          // spike so something renders.
          const username =
            (user['https://multiforum/username'] as string) ||
            (user.nickname as string) ||
            (user.preferred_username as string) ||
            '';
          seeded.value = { username, isAuthenticated: true };
        }
      } catch (err) {
        // Never let an auth read crash SSR — fall back to logged-out.
        console.error('[auth-session] getSession failed:', err);
      }
    }
  }

  // Runs on both server (seed reactive vars for the SSR render) and client
  // (re-seed from the payload before the first render, so hydration matches).
  if (seeded.value.isAuthenticated) {
    setIsAuthenticated(true);
    setUsername(seeded.value.username);
  }
});
