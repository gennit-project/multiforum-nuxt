<script setup lang="ts">
import { computed, ref, useId, nextTick } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { useUsername } from '@/composables/useAuthState';
import { timeAgo } from '@/utils';
import type { Notification } from '@/__generated__/graphql';
import MarkdownRenderer from '../MarkdownRenderer.vue';
import {
  MARK_NOTIFICATIONS_AS_READ,
  MARK_NOTIFICATION_AS_READ,
} from '@/graphQLData/user/mutations';
import { UPDATE_SCRATCHPAD_ENTRY_VISIBILITY } from '@/graphQLData/scratchpad/mutations';
import {
  GET_FEEDBACK_NOTIFICATIONS,
  GET_GENERAL_NOTIFICATIONS,
} from '@/graphQLData/notification/queries';

// The generated Notification type doesn't yet carry the ScratchpadEntry link
// (super upvote notifications), so augment it locally.
type ScratchpadEntryRef = { id: string; isPublic: boolean };
type NotificationWithEntry = Notification & {
  ScratchpadEntry?: ScratchpadEntryRef | null;
};

const NOTIFICATION_PAGE_LIMIT = 15;

type NotificationTab = 'general' | 'feedback';

const activeTab = defineModel<NotificationTab>('activeTab', {
  default: 'general',
});

// ARIA tabs wiring (WAI-ARIA tabs pattern): stable ids tie each tab to the
// shared panel, and arrow/Home/End keys move between tabs with focus.
const generalTabId = useId();
const feedbackTabId = useId();
const panelId = useId();
const generalTabRef = ref<HTMLButtonElement | null>(null);
const feedbackTabRef = ref<HTMLButtonElement | null>(null);

const activeTabId = computed(() =>
  activeTab.value === 'general' ? generalTabId : feedbackTabId
);

const selectTab = (tab: NotificationTab) => {
  activeTab.value = tab;
  nextTick(() => {
    (tab === 'general' ? generalTabRef.value : feedbackTabRef.value)?.focus();
  });
};

const onTabKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowLeft':
      event.preventDefault();
      selectTab(activeTab.value === 'general' ? 'feedback' : 'general');
      break;
    case 'Home':
      event.preventDefault();
      selectTab('general');
      break;
    case 'End':
      event.preventDefault();
      selectTab('feedback');
      break;
  }
};

const usernameVar = useUsername();

const username = computed(() => usernameVar.value);

// General notifications query
const {
  result: generalResult,
  error: generalError,
  loading: generalLoading,
  fetchMore: fetchMoreGeneral,
  refetch: refetchGeneral,
} = useQuery(
  GET_GENERAL_NOTIFICATIONS,
  () => ({
    username: username.value,
    options: {
      limit: NOTIFICATION_PAGE_LIMIT,
      offset: 0,
      sort: { createdAt: 'DESC' },
    },
  }),
  {
    fetchPolicy: 'cache-and-network',
    enabled: computed(() => !!username.value && activeTab.value === 'general'),
  }
);

// Feedback notifications query
const {
  result: feedbackResult,
  error: feedbackError,
  loading: feedbackLoading,
  fetchMore: fetchMoreFeedback,
  refetch: refetchFeedback,
} = useQuery(
  GET_FEEDBACK_NOTIFICATIONS,
  () => ({
    username: username.value,
    options: {
      limit: NOTIFICATION_PAGE_LIMIT,
      offset: 0,
      sort: { createdAt: 'DESC' },
    },
  }),
  {
    fetchPolicy: 'cache-and-network',
    enabled: computed(() => !!username.value && activeTab.value === 'feedback'),
  }
);

const {
  mutate: markNotificationsAsRead,
  loading: markAsReadLoading,
  error: markAsReadError,
  onDone: markAsReadDone,
} = useMutation(MARK_NOTIFICATIONS_AS_READ);

markAsReadDone(() => {
  if (activeTab.value === 'general') {
    refetchGeneral();
  } else {
    refetchFeedback();
  }
});

// Per-notification actions for super-upvote ("scratchpad") notifications:
// "Show on profile" publishes the thank-you note and marks the notification
// read; "Ignore" just marks it read.
const { mutate: markNotificationAsRead } = useMutation(MARK_NOTIFICATION_AS_READ);
const { mutate: showScratchpadEntry } = useMutation(
  UPDATE_SCRATCHPAD_ENTRY_VISIBILITY
);

const pendingNotificationId = ref<string | null>(null);
const actionError = ref('');

const refetchActive = () =>
  activeTab.value === 'general' ? refetchGeneral() : refetchFeedback();

const canActOnScratchpadEntry = (notification: NotificationWithEntry) =>
  notification.notificationType === 'scratchpad' &&
  !!notification.ScratchpadEntry?.id &&
  !notification.ScratchpadEntry.isPublic &&
  !notification.read;

const isPublishedScratchpadEntry = (notification: NotificationWithEntry) =>
  notification.notificationType === 'scratchpad' &&
  !!notification.ScratchpadEntry?.isPublic;

const handleIgnore = async (notification: NotificationWithEntry) => {
  pendingNotificationId.value = notification.id;
  actionError.value = '';
  try {
    await markNotificationAsRead({
      username: usernameVar.value,
      notificationId: notification.id,
    });
    await refetchActive();
  } catch (error) {
    actionError.value = (error as Error).message;
  } finally {
    pendingNotificationId.value = null;
  }
};

const handleShowOnProfile = async (notification: NotificationWithEntry) => {
  const entryId = notification.ScratchpadEntry?.id;
  if (!entryId) return;
  pendingNotificationId.value = notification.id;
  actionError.value = '';
  try {
    await showScratchpadEntry({ scratchpadEntryId: entryId, isPublic: true });
    await markNotificationAsRead({
      username: usernameVar.value,
      notificationId: notification.id,
    });
    await refetchActive();
  } catch (error) {
    actionError.value = (error as Error).message;
  } finally {
    pendingNotificationId.value = null;
  }
};

const generalNotifications = computed<NotificationWithEntry[]>(() => {
  if (!generalResult.value?.users?.[0]) return [];
  return generalResult.value.users[0].Notifications || [];
});

const feedbackNotifications = computed<NotificationWithEntry[]>(() => {
  if (!feedbackResult.value?.users?.[0]) return [];
  return feedbackResult.value.users[0].Notifications || [];
});

const generalUnreadCount = computed(() => {
  if (!generalResult.value?.users?.[0]) return 0;
  return generalResult.value.users[0].NotificationsAggregate?.count || 0;
});

const feedbackUnreadCount = computed(() => {
  if (!feedbackResult.value?.users?.[0]) return 0;
  return feedbackResult.value.users[0].NotificationsAggregate?.count || 0;
});

const currentNotifications = computed(() => {
  return activeTab.value === 'general'
    ? generalNotifications.value
    : feedbackNotifications.value;
});

const currentUnreadCount = computed(() => {
  return activeTab.value === 'general'
    ? generalUnreadCount.value
    : feedbackUnreadCount.value;
});

const generalTotalCount = computed(() => {
  if (!generalResult.value?.users?.[0]) return 0;
  return generalResult.value.users[0].totalNotificationsAggregate?.count || 0;
});

const feedbackTotalCount = computed(() => {
  if (!feedbackResult.value?.users?.[0]) return 0;
  return feedbackResult.value.users[0].totalNotificationsAggregate?.count || 0;
});

const currentTotalCount = computed(() => {
  return activeTab.value === 'general'
    ? generalTotalCount.value
    : feedbackTotalCount.value;
});

const isLoading = computed(() => {
  return activeTab.value === 'general' ? generalLoading.value : feedbackLoading.value;
});

const currentError = computed(() => {
  return activeTab.value === 'general' ? generalError.value : feedbackError.value;
});

const loadMore = () => {
  const currentResult =
    activeTab.value === 'general' ? generalResult.value : feedbackResult.value;
  const fetchMoreFn =
    activeTab.value === 'general' ? fetchMoreGeneral : fetchMoreFeedback;

  if (!currentResult?.users?.[0]) return;

  fetchMoreFn({
    variables: {
      options: {
        limit: NOTIFICATION_PAGE_LIMIT,
        offset: currentResult.users[0].Notifications?.length || 0,
        sort: { createdAt: 'DESC' },
      },
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;
      return {
        ...previousResult,
        users: [
          {
            ...previousResult.users[0],
            Notifications: [
              ...previousResult.users[0].Notifications,
              ...fetchMoreResult.users[0].Notifications,
            ],
          },
        ],
      };
    },
  });
};

const markAllAsRead = () => {
  markNotificationsAsRead({
    username: usernameVar.value,
  });
};

const totalNotifications = computed(() => {
  const result =
    activeTab.value === 'general' ? generalResult.value : feedbackResult.value;
  return result?.users?.[0]?.Notifications?.length || 0;
});

const reachedEnd = computed(() => {
  return totalNotifications.value >= currentTotalCount.value;
});
</script>

<template>
  <div class="flex justify-center dark:text-white">
    <div class="w-full max-w-5xl">
      <div class="mx-4 mb-4 mt-4">
        <h1 class="mb-4 border-b border-gray-500 text-2xl">Notifications</h1>

        <!-- Tab navigation -->
        <div
          role="tablist"
          aria-label="Notifications"
          class="mb-4 flex gap-2 border-b border-gray-200 dark:border-gray-700"
          @keydown="onTabKeydown"
        >
          <button
            :id="generalTabId"
            ref="generalTabRef"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'general'"
            :aria-controls="panelId"
            :tabindex="activeTab === 'general' ? 0 : -1"
            :class="[
              'px-4 py-2 text-sm font-medium',
              activeTab === 'general'
                ? 'border-b-2 border-orange-500 text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
            ]"
            @click="activeTab = 'general'"
          >
            General
            <span
              v-if="generalUnreadCount > 0"
              class="ml-1 rounded-full bg-orange-500 px-2 py-0.5 text-xs text-white"
            >
              {{ generalUnreadCount }}
            </span>
          </button>
          <button
            :id="feedbackTabId"
            ref="feedbackTabRef"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'feedback'"
            :aria-controls="panelId"
            :tabindex="activeTab === 'feedback' ? 0 : -1"
            :class="[
              'px-4 py-2 text-sm font-medium',
              activeTab === 'feedback'
                ? 'border-b-2 border-orange-500 text-gray-900 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
            ]"
            @click="activeTab = 'feedback'"
          >
            Feedback
            <span
              v-if="feedbackUnreadCount > 0"
              class="ml-1 rounded-full bg-orange-500 px-2 py-0.5 text-xs text-white"
            >
              {{ feedbackUnreadCount }}
            </span>
          </button>
        </div>
      </div>

      <div
        :id="panelId"
        role="tabpanel"
        :aria-labelledby="activeTabId"
        tabindex="0"
      >
      <p v-if="isLoading" class="px-4">Loading...</p>

      <ErrorBanner v-else-if="currentError" :text="currentError.message" />

      <p
        v-else-if="currentNotifications.length === 0"
        class="my-6 flex gap-2 px-4"
      >
        <span class="dark:text-white">
          {{
            activeTab === 'general'
              ? 'No general notifications to show.'
              : 'No feedback notifications to show.'
          }}
        </span>
      </p>

      <div v-if="currentNotifications.length > 0" class="flex flex-col gap-2">
        <p class="mx-4 text-sm text-gray-500 dark:text-gray-300">
          You have {{ currentUnreadCount }} unread
          {{ activeTab === 'feedback' ? 'feedback ' : '' }}notifications
        </p>
        <div>
          <GenericButton
            class="mx-4"
            text="Mark all as read"
            :loading="markAsReadLoading"
            @click="markAllAsRead"
          />
        </div>
        <ErrorBanner v-if="markAsReadError" :text="markAsReadError.message" />
        <ErrorBanner v-if="actionError" :text="actionError" />

        <ul
          role="list"
          class="flex-1 flex-col divide-y divide-gray-200 bg-white shadow dark:divide-gray-700 dark:bg-gray-800 dark:text-white sm:rounded-lg"
          data-testid="notification-list"
        >
          <li
            v-for="notification in currentNotifications"
            :key="notification.id"
            class="p-4"
          >
            <p class="mb-2 text-sm text-gray-500 dark:text-gray-300">
              {{ timeAgo(new Date(notification.createdAt)) }} -
              {{ notification.read ? 'Read' : 'Unread' }}
            </p>
            <MarkdownRenderer
              v-if="notification.text"
              :text="notification.text"
              class="w-full"
            />
            <div
              v-if="canActOnScratchpadEntry(notification)"
              class="mt-3 flex flex-wrap items-center gap-2"
              :data-testid="`scratchpad-notification-actions-${notification.id}`"
            >
              <button
                type="button"
                data-testid="notification-show-on-profile"
                :disabled="pendingNotificationId === notification.id"
                class="inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                @click="handleShowOnProfile(notification)"
              >
                <i class="fa-solid fa-star" />
                Show on profile
              </button>
              <button
                type="button"
                data-testid="notification-ignore"
                :disabled="pendingNotificationId === notification.id"
                class="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                @click="handleIgnore(notification)"
              >
                Ignore
              </button>
            </div>
            <p
              v-else-if="isPublishedScratchpadEntry(notification)"
              class="mt-2 text-sm text-green-600 dark:text-green-400"
              data-testid="notification-showing-on-profile"
            >
              <i class="fa-solid fa-circle-check mr-1" />
              Showing on your Kudos page
            </p>
          </li>
        </ul>

        <div v-if="!reachedEnd">
          <LoadMore
            class="ml-4 justify-self-center"
            :loading="isLoading"
            :reached-end-of-results="reachedEnd"
            @load-more="loadMore"
          />
        </div>
      </div>
      </div>
    </div>
  </div>
</template>
