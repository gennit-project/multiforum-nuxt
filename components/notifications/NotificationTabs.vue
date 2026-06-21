<script setup lang="ts">
import { computed } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { useUsername } from '@/composables/useAuthState';
import { timeAgo } from '@/utils';
import type { Notification } from '@/__generated__/graphql';
import MarkdownRenderer from '../MarkdownRenderer.vue';
import { MARK_NOTIFICATIONS_AS_READ } from '@/graphQLData/user/mutations';
import {
  GET_FEEDBACK_NOTIFICATIONS,
  GET_GENERAL_NOTIFICATIONS,
} from '@/graphQLData/notification/queries';

const NOTIFICATION_PAGE_LIMIT = 15;

type NotificationTab = 'general' | 'feedback';

const activeTab = defineModel<NotificationTab>('activeTab', {
  default: 'general',
});

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

const generalNotifications = computed<Notification[]>(() => {
  if (!generalResult.value?.users?.[0]) return [];
  return generalResult.value.users[0].Notifications || [];
});

const feedbackNotifications = computed<Notification[]>(() => {
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
        <div class="mb-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
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
</template>
