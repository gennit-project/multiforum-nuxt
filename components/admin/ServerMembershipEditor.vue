<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { config } from '@/config';
import {
  REMOVE_SERVER_ADMIN,
  REMOVE_SERVER_MODERATOR,
  INVITE_SERVER_ADMIN,
  CANCEL_INVITE_SERVER_ADMIN,
  INVITE_SERVER_MOD,
  CANCEL_INVITE_SERVER_MOD,
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

type PendingInvite = {
  username?: string | null;
  displayName?: string | null;
  profilePicURL?: string | null;
};

const props = defineProps<{
  serverConfig: {
    Admins?: ServerUser[] | null;
    Moderators?: ServerModerator[] | null;
    PendingAdminInvites?: PendingInvite[] | null;
    PendingModInvites?: PendingInvite[] | null;
  } | null;
  onUpdated?: () => void;
}>();

const newAdminUsername = ref('');
const newModeratorUsername = ref('');

// Invite mutations
const {
  mutate: inviteServerAdmin,
  loading: inviteServerAdminLoading,
  error: inviteServerAdminError,
} = useMutation(INVITE_SERVER_ADMIN);
const {
  mutate: cancelInviteServerAdmin,
  loading: cancelInviteServerAdminLoading,
  error: cancelInviteServerAdminError,
} = useMutation(CANCEL_INVITE_SERVER_ADMIN);
const {
  mutate: inviteServerMod,
  loading: inviteServerModLoading,
  error: inviteServerModError,
} = useMutation(INVITE_SERVER_MOD);
const {
  mutate: cancelInviteServerMod,
  loading: cancelInviteServerModLoading,
  error: cancelInviteServerModError,
} = useMutation(CANCEL_INVITE_SERVER_MOD);

// Remove mutations (for existing members)
const {
  mutate: removeServerAdmin,
  loading: removeServerAdminLoading,
  error: removeServerAdminError,
} = useMutation(REMOVE_SERVER_ADMIN);
const {
  mutate: removeServerModerator,
  loading: removeServerModeratorLoading,
  error: removeServerModeratorError,
} = useMutation(REMOVE_SERVER_MODERATOR);

const admins = computed(() => props.serverConfig?.Admins || []);
const moderators = computed(() => props.serverConfig?.Moderators || []);
const pendingAdminInvites = computed(() => props.serverConfig?.PendingAdminInvites || []);
const pendingModInvites = computed(() => props.serverConfig?.PendingModInvites || []);

const loading = computed(
  () =>
    inviteServerAdminLoading.value ||
    cancelInviteServerAdminLoading.value ||
    inviteServerModLoading.value ||
    cancelInviteServerModLoading.value ||
    removeServerAdminLoading.value ||
    removeServerModeratorLoading.value
);

const adminError = computed(
  () =>
    inviteServerAdminError.value ||
    cancelInviteServerAdminError.value ||
    removeServerAdminError.value
);

const modError = computed(
  () =>
    inviteServerModError.value ||
    cancelInviteServerModError.value ||
    removeServerModeratorError.value
);

const sendAdminInvite = async () => {
  const username = newAdminUsername.value.trim();
  if (!username) return;
  await inviteServerAdmin({
    serverName: config.serverName,
    inviteeUsername: username,
  });
  newAdminUsername.value = '';
  props.onUpdated?.();
};

const cancelAdminInvite = async (username: string) => {
  await cancelInviteServerAdmin({
    serverName: config.serverName,
    inviteeUsername: username,
  });
  props.onUpdated?.();
};

const removeAdmin = async (username: string) => {
  await removeServerAdmin({
    serverName: config.serverName,
    username,
  });
  props.onUpdated?.();
};

const sendModInvite = async () => {
  const username = newModeratorUsername.value.trim();
  if (!username) return;
  await inviteServerMod({
    serverName: config.serverName,
    inviteeUsername: username,
  });
  newModeratorUsername.value = '';
  props.onUpdated?.();
};

const cancelModInvite = async (username: string) => {
  await cancelInviteServerMod({
    serverName: config.serverName,
    inviteeUsername: username,
  });
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
        Invite users to become server admins or moderators. They will receive an invitation that they must accept.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Server Admins Column -->
      <div class="space-y-3">
        <h3 class="font-medium text-gray-900 dark:text-gray-100">Server Admins</h3>
        <div class="flex gap-2">
          <input
            v-model="newAdminUsername"
            type="text"
            placeholder="Username to invite"
            class="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            @keyup.enter="sendAdminInvite"
          >
          <button
            type="button"
            class="rounded bg-orange-500 px-3 py-2 text-white disabled:opacity-60"
            :disabled="loading || !newAdminUsername.trim()"
            @click="sendAdminInvite"
          >
            Invite
          </button>
        </div>
        <p v-if="adminError" class="text-sm text-red-600 dark:text-red-400">
          {{ adminError?.message }}
        </p>

        <!-- Pending Admin Invites -->
        <div v-if="pendingAdminInvites.length > 0" class="space-y-2">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Invites</h4>
          <div
            v-for="invite in pendingAdminInvites"
            :key="invite.username || ''"
            class="flex items-center justify-between rounded bg-yellow-50 p-2 dark:bg-yellow-900/20"
          >
            <div class="flex items-center gap-2">
              <AvatarComponent
                :text="invite.username || ''"
                :src="invite.profilePicURL ?? ''"
                class="h-6 w-6"
              />
              <span class="text-sm text-gray-900 dark:text-gray-100">
                {{ invite.username }}
              </span>
              <span class="text-xs text-yellow-600 dark:text-yellow-400">(pending)</span>
            </div>
            <button
              type="button"
              class="rounded border border-gray-400 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              :disabled="loading"
              @click="invite.username && cancelAdminInvite(invite.username)"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Current Admins -->
        <div v-if="admins.length === 0 && pendingAdminInvites.length === 0" class="text-sm text-gray-600 dark:text-gray-300">
          No server admins configured.
        </div>
        <div v-if="admins.length > 0" class="space-y-2">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Current Admins</h4>
          <div
            v-for="admin in admins"
            :key="admin.username || ''"
            class="flex items-center justify-between rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
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
      </div>

      <!-- Server Moderators Column -->
      <div class="space-y-3">
        <h3 class="font-medium text-gray-900 dark:text-gray-100">Server Moderators</h3>
        <div class="flex gap-2">
          <input
            v-model="newModeratorUsername"
            type="text"
            placeholder="Username to invite"
            class="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            @keyup.enter="sendModInvite"
          >
          <button
            type="button"
            class="rounded bg-orange-500 px-3 py-2 text-white disabled:opacity-60"
            :disabled="loading || !newModeratorUsername.trim()"
            @click="sendModInvite"
          >
            Invite
          </button>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          The invited user must have a moderation profile to accept.
        </p>
        <p v-if="modError" class="text-sm text-red-600 dark:text-red-400">
          {{ modError?.message }}
        </p>

        <!-- Pending Mod Invites -->
        <div v-if="pendingModInvites.length > 0" class="space-y-2">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Invites</h4>
          <div
            v-for="invite in pendingModInvites"
            :key="invite.username || ''"
            class="flex items-center justify-between rounded bg-yellow-50 p-2 dark:bg-yellow-900/20"
          >
            <div class="flex items-center gap-2">
              <AvatarComponent
                :text="invite.username || ''"
                :src="invite.profilePicURL ?? ''"
                class="h-6 w-6"
              />
              <span class="text-sm text-gray-900 dark:text-gray-100">
                {{ invite.username }}
              </span>
              <span class="text-xs text-yellow-600 dark:text-yellow-400">(pending)</span>
            </div>
            <button
              type="button"
              class="rounded border border-gray-400 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              :disabled="loading"
              @click="invite.username && cancelModInvite(invite.username)"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Current Moderators -->
        <div v-if="moderators.length === 0 && pendingModInvites.length === 0" class="text-sm text-gray-600 dark:text-gray-300">
          No server moderators configured.
        </div>
        <div v-if="moderators.length > 0" class="space-y-2">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Current Moderators</h4>
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
    </div>
  </section>
</template>
