// server/middleware/2.auth-session.ts
//
// SPIKE (auth0-nuxt server-session migration) — Phase 1, server half.
//
// `useAuth0(event).getSession()` is a NITRO server auto-import; it is only
// available in server/ handlers, NOT in a Nuxt app plugin (even during SSR).
// So we read the session here, in Nitro, and stash a small POJO on
// `event.context`. The app-side plugin (plugins/auth-session.ts) reads it back
// from `ssrContext.event.context` during SSR and transfers it to the client
// via the Nuxt payload. This is the bridge from the Nitro request context into
// the Vue/SSR render context.
//
// Numeric filename prefix controls middleware order (runs after
// 1.cache-control.ts), matching the existing convention in this directory.

type AuthSessionContext = {
  isAuthenticated: boolean;
  username: string;
};

declare module 'h3' {
  interface H3EventContext {
    authSession?: AuthSessionContext;
  }
}

export default defineEventHandler(async (event) => {
  try {
    // useAuth0 is auto-imported by @auth0/auth0-nuxt in the Nitro context.
    const session = await useAuth0(event).getSession();
    const user = session?.user;
    if (user) {
      // Username claim is set by the Auth0 PostLogin Action under the
      // https://gennit.net/ namespace. Until the Action also sets it on the ID
      // token (getSession reads ID-token claims), fall back to standard claims
      // so the spike still proves SSR-aware auth. email is the last resort.
      const username =
        (user['https://gennit.net/username'] as string) ||
        (user.nickname as string) ||
        (user.preferred_username as string) ||
        (user.email as string) ||
        '';
      event.context.authSession = { isAuthenticated: true, username };
    }
  } catch {
    // No session / not logged in — leave event.context.authSession unset.
    // Never block a request on the auth read.
  }
});
