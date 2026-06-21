// plugins/apollo-ssr-auth.ts
//
// SPIKE (auth0-nuxt server-session migration) — SSR auth for Apollo.
//
// Makes server-side GraphQL queries AUTHENTICATED, matching the client.
//
// @nuxtjs/apollo resolves the auth token via the `apollo:auth` hook first, then
// falls back to `localStorage[tokenName]` — which is client-only. So without
// this hook, SSR runs every query anonymously while the client (which has the
// token in localStorage, kept in sync by plugins/apollo-auth.client.ts) runs
// them authenticated. For permission-gated data (e.g. moderator/owner discussion
// controls, feedback/answer state) the anonymous SSR result differs from the
// authenticated client result, so the client's first hydration render does not
// match the server HTML — a hydration mismatch ("server rendered more child
// nodes than client vdom") that re-renders the content subtree.
//
// The session access token is already resolved server-side in
// server/middleware/2.auth-session.ts and stashed on `event.context.accessToken`.
// Here we hand it to Apollo on the server. On the client we set nothing, so the
// module falls through to its existing localStorage behavior.
//
// This is the SSR counterpart of plugins/apollo-auth.client.ts and the reason we
// can authenticate SSR without the cookieless `/api/auth/token` fetch that the
// `apollo:auth` hook would otherwise trigger during SSR: the token is read
// directly from the request context, no internal fetch involved.
//
// Per-request safety: forum detail pages are NOT route-cached (see the routeRules
// note in nuxt.config.ts), so each SSR render is for exactly one user — one
// user's token never authenticates another user's server render.
import { defineNuxtPlugin } from 'nuxt/app';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('apollo:auth', ({ token }) => {
    if (!import.meta.server) {
      // Client: leave unset so @nuxtjs/apollo reads localStorage[tokenName].
      return;
    }
    const accessToken = nuxtApp.ssrContext?.event?.context?.accessToken;
    if (accessToken) {
      token.value = accessToken;
    }
  });
});
