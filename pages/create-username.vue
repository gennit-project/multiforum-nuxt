<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { useRouter } from "vue-router";
import { useQuery } from "@vue/apollo-composable";
import { GET_EMAIL } from "@/graphQLData/email/queries";
import { usernameVar, userDataLoadingVar } from "@/cache";
import CreateUsernameForm from "@/components/auth/CreateUsernameForm.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";

const { user, isAuthenticated } = useAuth0();
const router = useRouter();
const emailNotInSystem = ref(false);
const initialCheckComplete = ref(false);
const loading = ref(true);

// Function to skip username creation and return to previous page
const skipUsernameCreation = () => {
  // Set the flag to prevent rechecking for username
  sessionStorage.setItem('hasCheckedUsername', 'true');
  
  // Redirect to home or previous page
  const previousPath = sessionStorage.getItem('previousPath') || '/';
  router.push(previousPath);
};

// Handle redirects when mounted
if (import.meta.client) {
  onMounted(() => {
    // Check for stored username
    const storedUsername = localStorage.getItem('username');
    
    // Redirect unauthenticated users to home page
    if (!isAuthenticated.value) {
      console.log("Not authenticated, redirecting to home");
      router.push('/');
    }
    // If we already have a username in state or storage, redirect back to previous page or home
    else if (usernameVar.value || storedUsername) {
      console.log("Username already exists, no need for creation page");
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
  <div class="flex justify-center items-center min-h-screen">
    <div class="max-w-md w-full">
      <h1 class="text-2xl font-bold text-center mb-8">Create Your Username</h1>

      <!-- Show loading state while checking email -->
      <div v-if="loading" class="text-center py-8">
        <LoadingSpinner />
        <p class="mt-4">Checking your account...</p>
      </div>

      <!-- Show the create username form only when ready -->
      <client-only>
        <div v-if="!loading && user?.email && !usernameVar && !userDataLoadingVar && emailNotInSystem && initialCheckComplete">
          <CreateUsernameForm
            :email="user.email"
            @email-and-user-created="router.push('/')"
          />
          
          <div class="text-center mt-6">
            <button 
              @click="skipUsernameCreation" 
              class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
            >
              Skip for now
            </button>
            <p class="text-xs text-gray-500 mt-2">
              You can create a username later in your account settings.
            </p>
          </div>
        </div>
      </client-only>
    </div>
  </div>
</template>