<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import { GET_OWN_EMAIL } from '@/graphQLData/email/queries';
import { userDataLoadingVar } from '@/cache';
import {
  useUsername,
  useIsAuthenticated,
  useEmail,
} from '@/composables/useAuthState';
import CreateUsernameForm from '@/components/auth/CreateUsernameForm.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const usernameVar = useUsername();
const isAuthenticatedVar = useIsAuthenticated();
const emailVar = useEmail();

// Auth state + verified email come from the server session (cache vars seeded by
// plugins/auth-session.ts), not the SPA.
const router = useRouter();
const emailNotInSystem = ref(false);
const initialCheckComplete = ref(false);
const loading = ref(true);

const isClient = typeof window !== 'undefined';
const shouldQueryOwnEmail = computed(
  () => isClient && isAuthenticatedVar.value && !usernameVar.value
);

const { onResult: onEmailResult } = useQuery(
  GET_OWN_EMAIL,
  null,
  { enabled: shouldQueryOwnEmail }
);

// Handle redirects when mounted
if (isClient) {
  onMounted(() => {
    // Check for stored username
    const storedUsername = localStorage.getItem('username');

    // Redirect unauthenticated users to home page
    if (!isAuthenticatedVar.value) {
      router.push('/');
    }
    // If we already have a username in state or storage, redirect back to previous page or home
    else if (usernameVar.value || storedUsername) {
      const previousPath = sessionStorage.getItem('previousPath') || '/';
      router.push(previousPath);
    }
  });

  // Also watch for username changes (in case it loads after mount)
  watch(usernameVar, (newUsername) => {
    if (newUsername) {
      const previousPath = sessionStorage.getItem('previousPath') || '/';
      router.push(previousPath);
    }
  });

  // getOwnEmail is self-scoped (resolves the caller's email from the token),
  // so it needs no variables. A returned `username` means the account already
  // exists; its absence means this verified email still needs a username.
  onEmailResult(
    (result: { data?: { getOwnEmail?: { username?: string | null } | null } }) => {
      const ownEmail = result.data?.getOwnEmail;
      if (ownEmail?.username) {
        // User already exists, redirect to home
        router.push('/');
      } else {
        // User doesn't exist, show the create username form
        emailNotInSystem.value = true;
      }
      initialCheckComplete.value = true;
      loading.value = false;
    }
  );
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="w-full max-w-md">
      <!-- Show loading state while checking email -->
      <div v-if="loading" class="py-8 text-center">
        <LoadingSpinner />
        <p class="mt-4">Checking your account...</p>
      </div>

      <!-- Show the create username form only when ready -->
      <client-only>
        <div
          v-if="
            !loading &&
            emailVar &&
            !usernameVar &&
            !userDataLoadingVar &&
            emailNotInSystem &&
            initialCheckComplete
          "
        >
          <CreateUsernameForm
            :email="emailVar"
            @email-and-user-created="router.push('/')"
          />
        </div>
      </client-only>
    </div>
  </div>
</template>
