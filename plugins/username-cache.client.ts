// plugins/username-cache.client.ts
import { defineNuxtPlugin } from 'nuxt/app';
import { setUsername } from '@/cache';
import {
  shouldRestoreUsername,
  USERNAME_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
} from '@/utils/authUtils';

export default defineNuxtPlugin((nuxtApp) => {
  // This plugin runs only on the client.
  if (typeof window === 'undefined') {
    return;
  }

  // Restore the username from localStorage, but only when a token is also
  // present. The username persists across sessions while the token does not,
  // so restoring it alone would produce a "ghost login" (see authUtils).
  //
  // IMPORTANT: this must NOT run before hydration. The server renders as
  // logged-out (it cannot read the localStorage token), so if we populated
  // usernameVar synchronously here the first client render would diverge from
  // the SSR output and trigger a hydration mismatch ("Hydration completed but
  // contains mismatches"). Vue then discards the server-rendered DOM and
  // re-renders, which users see as the page flashing/reloading. Components such
  // as DiscussionHeader read usernameVar directly, so they rely on it being
  // empty during initial hydration (the same contract RequireAuth documents).
  //
  // By restoring on `app:mounted` (after hydration completes), the initial
  // render matches SSR and the auth-gated UI then updates via a normal
  // reactive re-render instead of a hydration bailout.
  nuxtApp.hook('app:mounted', () => {
    const storedUsername = localStorage.getItem(USERNAME_STORAGE_KEY);
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (shouldRestoreUsername(storedUsername, token)) {
      setUsername(storedUsername as string);
    }
  });
});
