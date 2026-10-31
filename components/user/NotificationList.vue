<script setup lang="ts">
import { computed } from 'vue';
import { GetNotificationsDocument as GET_NOTIFICATIONS, MarkNotificationsAsReadDocument as MARK_NOTIFICATIONS_AS_READ  } from '@/__generated__/operations';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { useUsername } from '@/composables/useAuthState';
import { timeAgo } from '@/utils';
import { SortDirection } from '@/__generated__/graphql';
import type { GetNotificationsQuery } from '@/__generated__/operations';
import MarkdownRenderer from '../MarkdownRenderer.vue';

const NOTIFICATION_PAGE_LIMIT = 15;
type NotificationWithLink = GetNotificationsQuery['users'][number]['Notifications'][number];

const usernameVar = useUsername();

// Use computed for username to ensure reactivity
const username = computed(() => usernameVar.value);

const {
  result: notificationResult,
  error: notificationError,
  loading: notificationLoading,
  fetchMore,
  refetch,
} = useQuery(
  GET_NOTIFICATIONS,
  () => ({
    username: username.value,
    limit: NOTIFICATION_PAGE_LIMIT,
    offset: 0,
    sort: [{ createdAt: SortDirection.Desc }],
  }),
  {
    fetchPolicy: 'cache-and-network',
    // Only run the query when there's a username
    enabled: computed(() => !!username.value),
  }
);

const {
  mutate: markNotificationsAsRead,
  loading: markNotificationsAsReadLoading,
  error: markNotificationsAsReadError,
  onDone: markNotificationsAsReadDone,
} = useMutation(MARK_NOTIFICATIONS_AS_READ);

markNotificationsAsReadDone(() => {
  refetch();
});

const notifications = computed<NotificationWithLink[]>(() => {
  if (!notificationResult.value) {
    return [];
  }
  const userData = notificationResult.value.users[0];
  if (!userData) {
    return [];
  }
  return userData.Notifications;
});

const aggregateNotificationCount = computed(() => {
  if (!notificationResult.value) {
    return 0;
  }
  const userData = notificationResult.value.users[0];
  if (!userData) {
    return 0;
  }
  return userData.NotificationsAggregate?.aggregate?.count?.nodes || 0;
});

const loadMore = () => {
  fetchMore({
    variables: {
      username: username.value,
      limit: NOTIFICATION_PAGE_LIMIT,
      offset: notificationResult.value?.users[0]?.Notifications?.length ?? 0,
      sort: [{ createdAt: SortDirection.Desc }],
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      const previous = previousResult.users[0];
      const next = fetchMoreResult?.users[0];
      if (!previous || !next || previous.username !== username.value || next.username !== username.value) return previousResult;

      return {
        ...previousResult,
        users: [
          {
            ...previous,
            Notifications: [
              ...previous.Notifications,
              ...next.Notifications.filter((item) => !previous.Notifications.some((existing) => existing.id === item.id)),
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
</script>

<template>
  <div class="flex justify-center dark:text-white">
    <div class="w-full max-w-5xl">
      <StatusMessage :busy="notificationLoading">
        <p v-if="notificationLoading">Loading...</p>
        <p
          v-else-if="notifications && notifications.length === 0"
          class="my-6 flex gap-2 px-4"
        >
          <span class="dark:text-white"
            >There are no notifications to show.</span
          >
        </p>
      </StatusMessage>
      <ErrorBanner v-if="notificationError" :text="notificationError.message" />
      <div
        v-if="notifications && notifications.length > 0"
        class="flex flex-col gap-2"
      >
        <h1 class="mx-4 mt-4 mb-2 border-b border-gray-500 text-2xl">
          Notifications
        </h1>
        <p class="mx-4 text-sm text-gray-500 dark:text-gray-300">
          You have {{ aggregateNotificationCount }} unread notifications
        </p>
        <div>
          <GenericButton
            class="mx-4"
            :text="'Mark all as read'"
            :loading="markNotificationsAsReadLoading"
            @click="markAllAsRead"
          />
        </div>
        <ErrorBanner
          v-if="markNotificationsAsReadError"
          :text="markNotificationsAsReadError.message"
        />
        <ul
          role="list"
          class="flex-1 flex-col divide-y divide-gray-200 bg-white shadow sm:rounded-lg dark:divide-gray-700 dark:bg-gray-800 dark:text-white"
          data-testid="notification-list"
        >
          <li
            v-for="notification in notifications"
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
            <NuxtLink
              v-if="notification.link"
              :to="notification.link"
              class="text-brand-700 dark:text-brand-300 mt-2 inline-block text-sm underline"
            >
              View pipeline attempt
            </NuxtLink>
          </li>
        </ul>
        <div
          v-if="
            aggregateNotificationCount >
            notifications.length
          "
        >
          <LoadMore
            class="ml-4 justify-self-center"
            :loading="notificationLoading"
            :reached-end-of-results="
              aggregateNotificationCount ===
              notifications.length
            "
            @load-more="loadMore"
          />
        </div>
      </div>
    </div>
  </div>
</template>
