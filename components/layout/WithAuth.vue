<script setup lang="ts">
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useAuth0 } from '@/hooks/useAuth0';
import { GET_EMAIL } from '@/graphQLData/email/queries';
import ErrorBanner from '@/components/ErrorBanner.vue';
import CreateUsernamePage from '@/components/auth/CreateUsernamePage.vue';
import { usernameVar, modProfileNameVar } from '@/cache';

const { isLoading, user } = useAuth0();

const {
  result: emailResult,
  error: emailError,
  loading: emailLoading,
  onResult: onEmailResult
} = useQuery(GET_EMAIL, { emailAddress: user?.email });

// Reactive variable to track if the email is not in the system
const emailNotInSystem = ref(false);

// Handle email query result
onEmailResult(() => {
  let user = null;
  let modProfile = null;
  let username = '';
  let modProfileName = '';
  const emailData = emailResult.value?.emails[0];

  user = emailData?.User;

  if (!user) {
    emailNotInSystem.value = true;
  } else {
    username = user.username;
    modProfile = user.ModerationProfile;

    if (username) {
      // Store the authenticated user's username in the app state
      usernameVar(username);
    }

    if (modProfile) {
      modProfileName = modProfile.displayName;
      modProfileNameVar(modProfileName);
    }

    emailNotInSystem.value = false;
  }
});

</script>

<template>
  <div>
    <div v-if="isLoading || emailLoading">Loading...</div>
    <ErrorBanner v-else-if="emailError" :text="emailError?.message" />
    <div v-else-if="emailNotInSystem">
      <CreateUsernamePage @email-and-user-created="emailNotInSystem = false" />
    </div>
    <div v-else>
      <slot />
    </div>
  </div>
</template>
