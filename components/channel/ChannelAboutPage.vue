<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import type { User } from '@/__generated__/graphql';
import ChannelSidebar from '@/components/channel/ChannelSidebar.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import ReportChannelModal from '@/components/mod/ReportChannelModal.vue';
import LockChannelDialog from '@/components/mod/LockChannelDialog.vue';
import UnlockChannelDialog from '@/components/mod/UnlockChannelDialog.vue';
import { useRoute } from 'nuxt/app';
import { config } from '@/config';
import { usernameVar, modProfileNameVar } from '@/cache';
import { checkPermission } from '@/utils/permissionUtils';

const route = useRoute();
const channelId = computed(() => {
  if (typeof route.params.forumId === 'string') {
    return route.params.forumId;
  }
  return '';
});
const {
  error: getChannelError,
  result: getChannelResult,
  loading: getChannelLoading,
  refetch: refetchChannel,
} = useQuery(GET_CHANNEL, {
  uniqueName: channelId.value,
  now: new Date().toISOString(),
});

const channel = computed(() => {
  if (getChannelLoading.value || getChannelError.value) {
    return null;
  }
  return getChannelResult.value.channels[0];
});

const admins = computed(() => channel.value?.Admins ?? []);

const ownerList = computed(() =>
  admins.value.map((adminData: User) => adminData?.username)
);

const handleRefetchChannelData = () => {
  refetchChannel();
};

// Server config for permissions
const { result: serverConfigResult } = useQuery(
  GET_SERVER_CONFIG,
  { serverName: config.serverName },
  { fetchPolicy: 'cache-first' }
);

const serverConfig = computed(() => {
  return serverConfigResult.value?.serverConfigs?.[0] ?? null;
});

// Check if current user has canReport permission at server level
const canReportChannel = computed(() => {
  if (!serverConfig.value) return false;

  return checkPermission({
    permissionData: {
      Admins: serverConfig.value.Admins || [],
      Moderators: serverConfig.value.Moderators || [],
      SuspendedMods: [],
      SuspendedUsers: [],
    },
    standardModRole: serverConfig.value.DefaultModRole,
    elevatedModRole: serverConfig.value.DefaultElevatedModRole,
    username: usernameVar.value || '',
    modProfileName: modProfileNameVar.value || '',
    action: 'canReport',
  });
});

// Check if current user has canLockChannel permission at server level
const canLockChannel = computed(() => {
  if (!serverConfig.value) return false;

  // Server admins can always lock
  const isServerAdmin = serverConfig.value.Admins?.some(
    (admin: { username: string }) => admin.username === usernameVar.value
  );
  if (isServerAdmin) return true;

  return checkPermission({
    permissionData: {
      Admins: serverConfig.value.Admins || [],
      Moderators: serverConfig.value.Moderators || [],
      SuspendedMods: [],
      SuspendedUsers: [],
    },
    standardModRole: serverConfig.value.DefaultModRole,
    elevatedModRole: serverConfig.value.DefaultElevatedModRole,
    username: usernameVar.value || '',
    modProfileName: modProfileNameVar.value || '',
    action: 'canLockChannel',
  });
});

// Dialog states
const showReportModal = ref(false);
const showLockDialog = ref(false);
const showUnlockDialog = ref(false);

const openReportModal = () => {
  showReportModal.value = true;
};

const openLockDialog = () => {
  showLockDialog.value = true;
};

const openUnlockDialog = () => {
  showUnlockDialog.value = true;
};

const handleReported = () => {
  showReportModal.value = false;
};

const handleLocked = () => {
  showLockDialog.value = false;
  refetchChannel();
};

const handleUnlocked = () => {
  showUnlockDialog.value = false;
  refetchChannel();
};
</script>

<template>
  <div class="max-w-4xl justify-center p-8 dark:bg-gray-900">
    <div class="w-full py-3">
      <ChannelSidebar
        v-if="channel"
        :channel="channel"
        :use-scrollbar="false"
        @refetch-channel-data="handleRefetchChannelData"
      />
      <RequireAuth
        :require-ownership="true"
        :owners="ownerList"
        :justify-left="true"
        class="w-full"
      >
        <template #has-auth>
          <div class="flex w-full justify-between border-b border-gray-300">
            <span
              class="my-2 mb-2 w-full text-sm font-bold leading-6 text-gray-600 dark:text-gray-100"
            >
              Admin Actions
            </span>
          </div>
          <nuxt-link
            class="my-3 text-sm underline dark:text-gray-200"
            :to="{
              name: 'forums-forumId-edit',
              params: { forumId: channelId },
            }"
          >
            Edit
          </nuxt-link>
        </template>
      </RequireAuth>

      <!-- Server Moderation Actions -->
      <ClientOnly>
        <div v-if="canReportChannel || canLockChannel" class="mt-6">
          <div class="flex w-full justify-between border-b border-gray-300">
            <span
              class="my-2 mb-2 w-full text-sm font-bold leading-6 text-gray-600 dark:text-gray-100"
            >
              Server Moderation
            </span>
          </div>
          <div class="mt-3 flex flex-wrap gap-3">
            <button
              v-if="canReportChannel"
              class="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100 dark:border-red-600 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
              @click="openReportModal"
            >
              Report Forum
            </button>
            <button
              v-if="canLockChannel && channel && !channel.locked"
              class="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-sm text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50"
              @click="openLockDialog"
            >
              Lock Forum
            </button>
            <button
              v-if="canLockChannel && channel && channel.locked"
              class="rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
              @click="openUnlockDialog"
            >
              Unlock Forum
            </button>
          </div>
        </div>
      </ClientOnly>
    </div>

    <!-- Moderation Dialogs -->
    <ReportChannelModal
      v-if="channel"
      :channel-unique-name="channelId"
      :channel-display-name="channel.displayName || channelId"
      :open="showReportModal"
      @close="showReportModal = false"
      @reported="handleReported"
    />

    <LockChannelDialog
      v-if="channel"
      :channel-unique-name="channelId"
      :channel-display-name="channel.displayName || channelId"
      :open="showLockDialog"
      @close="showLockDialog = false"
      @locked="handleLocked"
    />

    <UnlockChannelDialog
      v-if="channel"
      :channel-unique-name="channelId"
      :channel-display-name="channel.displayName || channelId"
      :open="showUnlockDialog"
      @close="showUnlockDialog = false"
      @unlocked="handleUnlocked"
    />
  </div>
</template>

<style lang="scss" scoped>
/* Apply the user's preferred color scheme by default */
@media (prefers-color-scheme: dark) {
  #md-editor-v3-preview,
  #md-editor-v3-preview-wrapper {
    background-color: black;
  }
}

@media (prefers-color-scheme: light) {
  #md-editor-v3-preview,
  #md-editor-v3-preview-wrapper {
    background-color: orange;
  }
}
</style>
