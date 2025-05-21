<script lang="ts" setup>
  import { computed } from "vue";
  import { useRoute } from "nuxt/app";
  import { useQuery } from "@vue/apollo-composable";
  import { GET_SUSPENDED_USERS_IN_CHANNEL } from "@/graphQLData/mod/queries";
  import { DateTime } from "luxon";

  const route = useRoute();

  const forumId = computed(() => {
    if (typeof route.params.forumId === "string") {
      return route.params.forumId;
    }
    return "";
  });

  const {
    result: suspendedUsersResult,
    loading,
    error,
  } = useQuery(GET_SUSPENDED_USERS_IN_CHANNEL, {
    channelUniqueName: forumId.value,
  });

  const suspendedUsers = computed(() => {
    return suspendedUsersResult.value?.channels[0]?.SuspendedUsers ?? [];
  });

  const aggregateCount = computed(() => {
    return suspendedUsersResult.value?.channels[0]?.SuspendedUsersAggregate?.count ?? 0;
  });

  const humanReadableDate = (dateISO: string): string => {
    return DateTime.fromISO(dateISO).toLocaleString(DateTime.DATETIME_MED);
  };
</script>

<template>
  <div class="flex-col space-y-4 dark:text-white">
    <div class="mb-6">
      <h1 class="mb-2 text-xl font-bold">User Suspensions</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{
          `These are the active suspensions of users from ${forumId}. It's possible for a user to be listed twice if moderation actions were taken on more than one of their posts.`
        }}
      </p>
      <ul class="ml-4 list-outside list-disc text-sm text-gray-600 dark:text-gray-400">
        <li>To un-suspend a user, click Related Issue and follow the provided instructions.</li>
        <li>
          To suspend a user, go to the rule-breaking comment or post and click Suspend User in the
          action menu.
        </li>
      </ul>
    </div>
    <div class="flex flex-col gap-3 py-3 dark:text-white">
      <div v-if="loading">Loading...</div>
      <ErrorBanner
        v-else-if="error"
        :text="error.message"
      />
      <div v-else-if="suspendedUsers.length === 0">This forum has no suspended users.</div>
      <div>
        {{ `Active Suspensions (${aggregateCount})` }}
      </div>
      <div
        v-if="suspendedUsers.length > 0"
        class="flex-col text-sm"
      >
        <div
          v-for="user in suspendedUsers"
          :key="user.username"
          class="flex items-center justify-between rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <div class="w-full flex-col">
            <div class="flex w-full justify-between gap-2">
              <nuxt-link
                class="flex items-center font-bold dark:text-white"
                :to="{
                  name: 'u-username',
                  params: { username: user.username },
                }"
              >
                <AvatarComponent
                  class="mr-2 h-6 w-6"
                  :src="user.profilePicURL ?? ''"
                  :text="user.username"
                />
                <UsernameWithTooltip
                  v-if="user.username"
                  :account-created="user.createdAt ?? ''"
                  :comment-karma="user.commentKarma ?? 0"
                  :discussion-karma="user.discussionKarma ?? 0"
                  :display-name="user.displayName ?? ''"
                  :src="user.profilePicURL ?? ''"
                  :username="user.username"
                />
              </nuxt-link>
              <nuxt-link
                v-if="user.RelatedIssue"
                class="flex items-center gap-1 rounded border border-blue-500 px-2 py-1 text-blue-500"
                :to="{
                  name: 'forums-forumId-issues-issueId',
                  params: { issueId: user.RelatedIssue?.id },
                }"
              >
                Related Issue
              </nuxt-link>
            </div>
            <div
              v-if="!user.suspendedIndefinitely"
              class="text-sm text-gray-500 dark:text-gray-300"
            >
              {{ `Suspended until ${humanReadableDate(user.suspendedUntil)}` }}
            </div>
            <div
              v-else
              class="text-sm text-gray-500 dark:text-gray-300"
            >
              {{ `Suspended indefinitely as of ${humanReadableDate(user.createdAt)}` }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
