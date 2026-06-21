<script setup lang="ts">
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useRouter } from 'nuxt/app';
import { config } from '@/config';
import { ACCEPT_SERVER_MOD_INVITE } from '@/graphQLData/admin/mutations';
import { useUsername, useModProfileName } from '@/composables/useAuthState';

// @ts-ignore - definePageMeta is auto-imported by Nuxt
definePageMeta({
  middleware: 'auth',
});

const usernameVar = useUsername();
const modProfileNameVar = useModProfileName();

const router = useRouter();
const accepted = ref(false);
const errorMessage = ref('');

const {
  mutate: acceptInvite,
  loading,
  error,
  onDone,
} = useMutation(ACCEPT_SERVER_MOD_INVITE);

onDone((result) => {
  if (result.data?.acceptServerModInvite) {
    accepted.value = true;
  } else {
    errorMessage.value = 'Failed to accept the invitation. Please try again.';
  }
});

const handleAccept = async () => {
  errorMessage.value = '';
  try {
    await acceptInvite({
      serverName: config.serverName,
    });
  } catch (e) {
    console.error('Error accepting invite:', e);
  }
};

const goToAdmin = () => {
  router.push({ name: 'admin-roles' });
};
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-8">
    <div class="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <template v-if="!usernameVar">
        <h1 class="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Sign In Required
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
          Please sign in to accept your server moderator invitation.
        </p>
      </template>

      <template v-else-if="!modProfileNameVar">
        <h1 class="mb-4 text-xl font-semibold text-yellow-600 dark:text-yellow-400">
          Moderation Profile Required
        </h1>
        <p class="mb-4 text-gray-600 dark:text-gray-300">
          To become a server moderator, you need to have a moderation profile. Please create one first.
        </p>
        <button
          type="button"
          class="rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          @click="router.push({ name: 'mod-create' })"
        >
          Create Moderation Profile
        </button>
      </template>

      <template v-else-if="accepted">
        <h1 class="mb-4 text-xl font-semibold text-green-600 dark:text-green-400">
          Invitation Accepted
        </h1>
        <p class="mb-4 text-gray-600 dark:text-gray-300">
          You are now a server moderator. Your moderation profile
          <span class="font-medium">{{ modProfileNameVar }}</span> has been added to the server moderators list.
        </p>
        <button
          type="button"
          class="rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          @click="goToAdmin"
        >
          Go to Admin Panel
        </button>
      </template>

      <template v-else>
        <h1 class="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Server Moderator Invitation
        </h1>
        <p class="mb-4 text-gray-600 dark:text-gray-300">
          You have been invited to become a server moderator. As a server moderator, you will have elevated moderation permissions across the server.
        </p>
        <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
          Logged in as: <span class="font-medium">{{ usernameVar }}</span>
        </p>
        <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Moderation profile: <span class="font-medium">{{ modProfileNameVar }}</span>
        </p>

        <div v-if="error || errorMessage" class="mb-4 rounded bg-red-50 p-3 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {{ error?.message || errorMessage }}
        </div>

        <div class="flex gap-3">
          <button
            type="button"
            class="rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-60"
            :disabled="loading"
            @click="handleAccept"
          >
            {{ loading ? 'Accepting...' : 'Accept Invitation' }}
          </button>
          <button
            type="button"
            class="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="router.push({ name: 'index' })"
          >
            Decline
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
