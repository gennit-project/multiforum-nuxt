// plugins/username-cache.client.ts
import { defineNuxtPlugin } from 'nuxt/app';
import { setUsername } from '@/cache';
import {
  shouldRestoreUsername,
  USERNAME_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
} from '@/utils/authUtils';

export default defineNuxtPlugin(() => {
  // This plugin runs only on the client
  if (typeof window !== 'undefined') {
    // Restore the username from localStorage, but only when a token is also
    // present. The username persists across sessions while the token does not,
    // so restoring it alone would produce a "ghost login" (see authUtils).
    const storedUsername = localStorage.getItem(USERNAME_STORAGE_KEY);
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (shouldRestoreUsername(storedUsername, token)) {
      setUsername(storedUsername as string);
    }
  }
});
