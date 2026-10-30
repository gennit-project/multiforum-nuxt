<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  useUsername,
  useIsAuthenticated,
  useEmail,
} from '@/composables/useAuthState';
import CreateUsernameForm from '@/components/auth/CreateUsernameForm.vue';
import { useHead } from 'nuxt/app';

useHead({ title: 'Choose a username' });

const usernameVar = useUsername();
const isAuthenticatedVar = useIsAuthenticated();
const emailVar = useEmail();

// Auth state + login email come from the server session (cache vars seeded by
// plugins/auth-session.ts), not the SPA.
const router = useRouter();
const returnToPreviousPage = () => {
  const previousPath = sessionStorage.getItem('previousPath') || '/';
  sessionStorage.removeItem('previousPath');
  const safePath =
    previousPath.startsWith('/') &&
    !previousPath.startsWith('//') &&
    !previousPath.split(/[?#]/)[0]?.startsWith('/create-username')
      ? previousPath
      : '/';
  router.replace(safePath);
};
const isClient = typeof window !== 'undefined';

// Handle redirects when mounted
if (isClient) {
  onMounted(() => {
    // Redirect unauthenticated users to home page
    if (!isAuthenticatedVar.value) {
      router.push('/');
    }
    // If we already have a username in the current session, redirect back to previous page or home
    else if (usernameVar.value) {
      returnToPreviousPage();
    }
  });

  // Also watch for username changes (in case it loads after mount)
  watch(usernameVar, (newUsername) => {
    if (newUsername) {
      returnToPreviousPage();
    }
  });
}
</script>

<template>
  <main
    id="main-content"
    tabindex="-1"
    class="min-h-screen px-4 py-8 outline-none"
  >
    <div class="mx-auto w-full max-w-lg">
      <!-- Show the create username form only when ready -->
      <client-only>
        <div v-if="isAuthenticatedVar && !usernameVar">
          <CreateUsernameForm :email="emailVar" />
        </div>
      </client-only>
    </div>
  </main>
</template>
