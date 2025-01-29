<script setup lang="ts">
import { computed } from "vue";
import { GET_NOTIFICATIONS } from "@/graphQLData/notification/queries";
import { useQuery } from "@vue/apollo-composable";
import { usernameVar } from "@/cache";
import { timeAgo } from "@/utils";
import type { Notification } from "@/__generated__/graphql";
import MarkdownPreview from "../MarkdownPreview.vue";

const NOTIFICATION_PAGE_LIMIT = 15;

const {
  result: notificationResult,
  error: notificationError,
  loading: notificationLoading,
  fetchMore,
} = useQuery(GET_NOTIFICATIONS, {
  username: usernameVar.value,
  options: {
    limit: NOTIFICATION_PAGE_LIMIT,
    offset: 0,
    sort: {
      createdAt: "DESC",
    },
  },
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
</script>

<template>
  <div class="flex justify-center">
    <p v-if="notificationLoading">Loading...</p>
    <ErrorBanner
      v-else-if="notificationError"
      class="max-w-5xl"
      :text="notificationError.message"
    />
    <p
      v-else-if="notifications && notifications.length === 0"
      class="my-6 flex gap-2 px-4"
    >
      <span class="dark:text-white">There are no notifications to show.</span>
    </p>
    <div v-if="notifications && notifications.length > 0" class="p-0 max-w-5xl">
      <h1 class="text-2xl mt-4 ml-4">Notifications</h1>
      <ul
        role="list"
        class="flex flex-col divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 shadow sm:rounded-lg p-0 m-0 dark:text-gray-100"
        data-testid="notification-list"
      >
        <li
          v-for="notification in notifications"
          :key="notification.id"
          class="p-4 flex-col"
        >
          <p class="text-gray-500 dark:text-gray-300 text-sm mb-2">{{ timeAgo(new Date(notification.createdAt)) }}</p>
          <MarkdownPreview
            v-if="notification.text" :text="notification.text" 
            class="-ml-4"
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
</template>
