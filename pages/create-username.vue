<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
import { useRouter } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';
import { GET_EMAIL } from '@/graphQLData/email/queries';
import { usernameVar, userDataLoadingVar } from '@/cache';
import CreateUsernameForm from '@/components/auth/CreateUsernameForm.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const { user, isAuthenticated } = useAuth0();
const router = useRouter();
const emailNotInSystem = ref(false);
const initialCheckComplete = ref(false);
const loading = ref(true);

// Handle redirects when mounted
if (import.meta.client) {
  onMounted(() => {
    // Check for stored username
    const storedUsername = localStorage.getItem('username');

    // Redirect unauthenticated users to home page
    if (!isAuthenticated.value) {
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

  // Only check email if we're authenticated and on the client side
  if (isAuthenticated.value) {
    const { onResult: onEmailResult } = useQuery(GET_EMAIL, {
      emailAddress: user.value?.email,
    });

    onEmailResult((result: any) => {
      const emailData = result.data?.emails[0];
      if (emailData?.User) {
        // User already exists, redirect to home
        router.push('/');
      } else {
        // User doesn't exist, show the create username form
        emailNotInSystem.value = true;
      }
      initialCheckComplete.value = true;
      loading.value = false;
    });
  }
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
            user?.email &&
            !usernameVar &&
            !userDataLoadingVar &&
            emailNotInSystem &&
            initialCheckComplete
          "
        >
          <CreateUsernameForm
            :email="user.email"
            @email-and-user-created="router.push('/')"
          />
        </div>
      </client-only>
    </div>
  </div>
</template>
