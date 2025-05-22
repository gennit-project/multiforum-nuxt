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
    refetch,
  } = useQuery(
    GET_NOTIFICATIONS,
    () => ({
      username: username.value,
      options: {
        limit: NOTIFICATION_PAGE_LIMIT,
        offset: 0,
        sort: {
          createdAt: "DESC",
        },
      },
    }),
    {
      fetchPolicy: "cache-and-network",
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
  <div class="dak:text-white flex justify-center">
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
        <h1 class="mx-4 mb-2 mt-4 border-b border-gray-300 text-2xl">Notifications</h1>
        <p class="mx-4 text-sm text-gray-500 dark:text-gray-300">
          You have {{ aggregateNotificationCount }} unread notifications
        </p>
        <div>
          <GenericButton
            class="mx-4"
            :loading="markNotificationsAsReadLoading"
            :text="'Mark all as read'"
            @click="markAllAsRead"
          />
        </div>
        <ErrorBanner
          v-if="markNotificationsAsReadError"
          :text="markNotificationsAsReadError.message"
        />
        <ul
          class="flex-1 flex-col divide-y divide-gray-200 bg-white shadow dark:divide-gray-700 dark:bg-gray-800 dark:text-white sm:rounded-lg"
          data-testid="notification-list"
          role="list"
        >
          <li
            v-for="notification in notifications"
            :key="notification.id"
            class="p-4"
          >
            <p class="mb-2 text-sm text-gray-500 dark:text-gray-300">
              {{ timeAgo(new Date(notification.createdAt)) }} -
              {{ notification.read ? "Read" : "Unread" }}
            </p>
            <MarkdownRenderer
              v-if="notification.text"
              class="w-full"
              :text="notification.text"
            />
          </li>
        </ul>
        <div v-if="aggregateNotificationCount > notificationResult.users[0].Notifications.length">
          <LoadMore
            class="ml-4 justify-self-center"
            :loading="notificationLoading"
            :reached-end-of-results="
              aggregateNotificationCount === notificationResult.users[0].Notifications.length
            "
            @load-more="loadMore"
          />
        </div>
      </div>
    </div>
  </div>
</template>
