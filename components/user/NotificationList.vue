<script setup lang="ts">
import { computed } from "vue";
import { GET_NOTIFICATIONS } from "@/graphQLData/notification/queries";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { usernameVar } from "@/cache";
import { timeAgo } from "@/utils";
import type { Notification } from "@/__generated__/graphql";
import MarkdownRenderer from "../MarkdownRenderer.vue";
import { MARK_NOTIFICATIONS_AS_READ } from "@/graphQLData/user/mutations";

const NOTIFICATION_PAGE_LIMIT = 15;

// Use computed for username to ensure reactivity
const username = computed(() => usernameVar.value);

const {
  result: notificationResult,
  error: notificationError,
  loading: notificationLoading,
  fetchMore,
  refetch
} = useQuery(GET_NOTIFICATIONS, () => ({
  username: username.value,
  options: {
    limit: NOTIFICATION_PAGE_LIMIT,
    offset: 0,
    sort: {
      createdAt: "DESC",
    },
  }
}), {
  fetchPolicy: 'cache-and-network',
  // Only run the query when there's a username
  enabled: computed(() => !!username.value)
});

const { 
    mutate: markNotificationsAsRead,
    loading: markNotificationsAsReadLoading,
    error: markNotificationsAsReadError,
    onDone: markNotificationsAsReadDone,
} = useMutation(MARK_NOTIFICATIONS_AS_READ,);

markNotificationsAsReadDone(() => {
  refetch();
});

const notifications = computed<Notification[]>(() => {
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
  return userData.NotificationsAggregate?.count || 0;
});

const loadMore = () => {
  fetchMore({
    variables: {
      options: {
        limit: NOTIFICATION_PAGE_LIMIT,
        offset: notificationResult.value.users[0]?.Notifications?.length,
        sort: {
          createdAt: "DESC",
        },
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
</script>

<template>
  <div class="flex justify-center dak:text-white">
    <div class="w-full max-w-5xl">
      <p v-if="notificationLoading">Loading...</p>
      <ErrorBanner
        v-else-if="notificationError"
        :text="notificationError.message"
      />
      <p
        v-else-if="notifications && notifications.length === 0"
        class="my-6 flex gap-2 px-4"
      >
        <span class="dark:text-white">There are no notifications to show.</span>
      </p>
      <div
        v-if="notifications && notifications.length > 0"
        class="flex flex-col gap-2"
      >
<<<<<<< HEAD
        <h1 class="mx-4 mb-2 mt-4 border-b border-gray-300 text-2xl">Notifications</h1>
        <p class="mx-4 text-sm text-gray-500 dark:text-gray-300">
=======
        <h1 class="text-2xl border-b border-gray-500 mt-4 mx-4 mb-2">Notifications</h1>
        <p class="text-sm text-gray-500 dark:text-gray-300 mx-4">
>>>>>>> parent of 666ae3d (Use automated formatting tools)
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
        <ErrorBanner v-if="markNotificationsAsReadError" :text="markNotificationsAsReadError.message" />
        <ul
          role="list"
          class="flex-1 flex-col divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 dark:text-white shadow sm:rounded-lg"
          data-testid="notification-list"
        >
          <li
            v-for="notification in notifications"
            :key="notification.id"
            class="p-4"
          >
            <p class="text-gray-500 dark:text-gray-300 text-sm mb-2">
              {{ timeAgo(new Date(notification.createdAt)) }} - {{ notification.read ? "Read" : "Unread" }}
            </p>
            <MarkdownRenderer
              v-if="notification.text"
              :text="notification.text"
              class="w-full"
            />
          </li>
        </ul>
        <div
          v-if="
            aggregateNotificationCount >
            notificationResult.users[0].Notifications.length
          "
        >
          <LoadMore
            class="ml-4 justify-self-center"
            :loading="notificationLoading"
            :reached-end-of-results="
              aggregateNotificationCount ===
              notificationResult.users[0].Notifications.length
            "
            @load-more="loadMore"
          />
        </div>
      </div>
    </div>
  </div>
</template>
