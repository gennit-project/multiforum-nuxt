<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { config } from '@/config';
import {
  ADD_SERVER_ADMIN,
  REMOVE_SERVER_ADMIN,
  ADD_SERVER_MODERATOR,
  REMOVE_SERVER_MODERATOR,
} from '@/graphQLData/admin/mutations';

type ServerUser = {
  username?: string | null;
  displayName?: string | null;
  profilePicURL?: string | null;
  commentKarma?: number | null;
  discussionKarma?: number | null;
  createdAt?: string | null;
};

type ServerModerator = {
  displayName?: string | null;
  User?: ServerUser | null;
};

const props = defineProps<{
  serverConfig: {
    Admins?: ServerUser[] | null;
    Moderators?: ServerModerator[] | null;
  } | null;
  onUpdated?: () => void;
}>();

const newAdminUsername = ref('');
const newModeratorDisplayName = ref('');

const {
  mutate: addServerAdmin,
  loading: addServerAdminLoading,
  error: addServerAdminError,
} = useMutation(ADD_SERVER_ADMIN);
const {
  mutate: removeServerAdmin,
  loading: removeServerAdminLoading,
  error: removeServerAdminError,
} = useMutation(REMOVE_SERVER_ADMIN);
const {
  mutate: addServerModerator,
  loading: addServerModeratorLoading,
  error: addServerModeratorError,
} = useMutation(ADD_SERVER_MODERATOR);
const {
  mutate: removeServerModerator,
  loading: removeServerModeratorLoading,
  error: removeServerModeratorError,
} = useMutation(REMOVE_SERVER_MODERATOR);

const admins = computed(() => props.serverConfig?.Admins || []);
const moderators = computed(() => props.serverConfig?.Moderators || []);
const loading = computed(
  () =>
    addServerAdminLoading.value ||
    removeServerAdminLoading.value ||
    addServerModeratorLoading.value ||
    removeServerModeratorLoading.value
);

const addAdmin = async () => {
  const username = newAdminUsername.value.trim();
  if (!username) return;
  await addServerAdmin({
    serverName: config.serverName,
    username,
  });
  newAdminUsername.value = '';
  props.onUpdated?.();
};

const removeAdmin = async (username: string) => {
  await removeServerAdmin({
    serverName: config.serverName,
    username,
  });
  props.onUpdated?.();
};

const addModerator = async () => {
  const displayName = newModeratorDisplayName.value.trim();
  if (!displayName) return;
  await addServerModerator({
    serverName: config.serverName,
    displayName,
  });
  newModeratorDisplayName.value = '';
  props.onUpdated?.();
};

const removeModerator = async (displayName: string) => {
  await removeServerModerator({
    serverName: config.serverName,
    displayName,
  });
  props.onUpdated?.();
};
</script>

<template>
  <section class="space-y-6 rounded-lg border p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800">
    <div class="space-y-1">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Server Membership
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Manage server-scoped admins and moderators directly on the server configuration.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="space-y-3">
        <h3 class="font-medium text-gray-900 dark:text-gray-100">Server Admins</h3>
        <div class="flex gap-2">
          <input
            v-model="newAdminUsername"
            type="text"
            placeholder="Username"
            class="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          >
          <button
            type="button"
            class="rounded bg-orange-500 px-3 py-2 text-white disabled:opacity-60"
            :disabled="loading"
            @click="addAdmin"
          >
            Add
          </button>
        </div>
        <p v-if="addServerAdminError || removeServerAdminError" class="text-sm text-red-600 dark:text-red-400">
          {{ addServerAdminError?.message || removeServerAdminError?.message }}
        </p>
        <div v-if="admins.length === 0" class="text-sm text-gray-600 dark:text-gray-300">
          No server admins configured.
        </div>
        <div v-for="admin in admins" :key="admin.username || ''" class="flex items-center justify-between rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
          <div class="flex items-center gap-2">
            <AvatarComponent
              :text="admin.username || ''"
              :src="admin.profilePicURL ?? ''"
              class="h-6 w-6"
            />
            <UsernameWithTooltip
              v-if="admin.username"
              :username="admin.username"
              :src="admin.profilePicURL ?? ''"
              :display-name="admin.displayName ?? ''"
              :comment-karma="admin.commentKarma ?? 0"
              :discussion-karma="admin.discussionKarma ?? 0"
              :account-created="admin.createdAt ?? ''"
            />
          </div>
          <button
            type="button"
            class="rounded border border-orange-500 px-2 py-1 text-sm text-orange-500"
            :disabled="loading"
            @click="admin.username && removeAdmin(admin.username)"
          >
            Remove
          </button>
        </div>
      </div>

      <div class="space-y-3">
        <h3 class="font-medium text-gray-900 dark:text-gray-100">Server Moderators</h3>
        <div class="flex gap-2">
          <input
            v-model="newModeratorDisplayName"
            type="text"
            placeholder="Mod profile display name"
            class="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          >
          <button
            type="button"
            class="rounded bg-orange-500 px-3 py-2 text-white disabled:opacity-60"
            :disabled="loading"
            @click="addModerator"
          >
            Add
          </button>
        </div>
        <p v-if="addServerModeratorError || removeServerModeratorError" class="text-sm text-red-600 dark:text-red-400">
          {{ addServerModeratorError?.message || removeServerModeratorError?.message }}
        </p>
        <div v-if="moderators.length === 0" class="text-sm text-gray-600 dark:text-gray-300">
          No server moderators configured.
        </div>
        <div
          v-for="moderator in moderators"
          :key="moderator.displayName || ''"
          class="flex items-center justify-between rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <div class="flex flex-col">
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ moderator.displayName }}
            </span>
            <span class="text-sm text-gray-600 dark:text-gray-300">
              {{ moderator.User?.username ? `u/${moderator.User.username}` : 'No linked user' }}
            </span>
          </div>
          <button
            type="button"
            class="rounded border border-orange-500 px-2 py-1 text-sm text-orange-500"
            :disabled="loading"
            @click="moderator.displayName && removeModerator(moderator.displayName)"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
