// plugins/auth-session.ts
//
// SPIKE (auth0-nuxt server-session migration) — Phase 1, app half.
//
// This is the change that makes SSR auth-aware and eliminates the whole class
// of auth hydration mismatches. With the server-session SDK, the server knows
// who the user is *before* it renders, so we can:
//   1. seed the reactive auth vars (usernameVar / isAuthenticatedVar) on the
//      server so SSR renders authenticated content, and
//   2. transfer that exact state to the client via the Nuxt payload (useState),
//      so the client's first hydration render matches the server (no mismatch).
//
// The session itself is read in Nitro (server/middleware/2.auth-session.ts),
// because useAuth0(event) is a server-only auto-import. That middleware leaves
// the result on `event.context.authSession`; here we pick it up during SSR.
//
// This is a UNIVERSAL plugin on purpose: the server branch reads the context
// and writes the payload; the tail runs on BOTH sides and seeds the reactive
// vars — on the client it reads the value back out of the payload before the
// first render. A `.server.ts` plugin would not run on the client, so the
// client would never re-seed and we'd be back to a mismatch.
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

export default defineNuxtPlugin((nuxtApp) => {
  // useState is SSR-serialized: written on the server, read on the client from
  // the payload — the transport that keeps both sides in sync.
  const seeded = useState<SeededAuth>('auth-session', () => ({
    username: '',
    isAuthenticated: false,
  }));

  if (import.meta.server) {
    const ctx = nuxtApp.ssrContext?.event?.context?.authSession;
    if (ctx?.isAuthenticated) {
      seeded.value = { username: ctx.username, isAuthenticated: true };
    }
  }

  // Runs on both server (seed reactive vars for the SSR render) and client
  // (re-seed from the payload before the first render, so hydration matches).
  if (seeded.value.isAuthenticated) {
    setIsAuthenticated(true);
    setUsername(seeded.value.username);
  }
});
