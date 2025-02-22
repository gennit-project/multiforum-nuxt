<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "nuxt/app";
import { useQuery } from "@vue/apollo-composable";
import { GET_SUSPENDED_USERS_IN_CHANNEL } from "@/graphQLData/mod/queries";

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
</script>

<template>
  <div class="flex-col space-y-4 dark:text-white">
    <div class="mb-6">
      <h1 class="text-xl font-bold mb-2">Suspended Users</h1>
      <p class="text-gray-600 text-sm dark:text-gray-400">
        {{ `These users have been suspended from ${forumId}.` }}
      </p>
      <ul
        class="text-gray-600 text-sm dark:text-gray-400 list-disc ml-4 list-outside"
      >
        <li>
          To un-suspend a user, click Related Issue and follow the provided
          instructions.
        </li>
        <li>
          To suspend a user, go to the rule-breaking comment or post and click
          Suspend User in the action menu.
        </li>
      </ul>
    </div>
    <div class="flex flex-col gap-3 py-3 dark:text-white">
      <div v-if="loading">Loading...</div>
      <ErrorBanner v-else-if="error" :text="error.message" />
      <div
        v-else-if="
          suspendedUsers.length === 0
        "
      >
        This forum has no suspended users.
      </div>
      <div v-if="suspendedUsers.length > 0" class="flex-col text-sm ">
        <div
          v-for="user in suspendedUsers"
          :key="user.username"
          class="flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
        >
          <nuxt-link
            :to="{ name: 'u-username', params: { username: user.username } }"
            class="flex items-center dark:text-white font-bold"
          >
            <AvatarComponent
              :text="user.username"
              :src="user.profilePicURL ?? ''"
              class="mr-2 h-6 w-6"
            />
            <UsernameWithTooltip
              v-if="user.username"
              :username="user.username"
              :src="user.profilePicURL ?? ''"
              :display-name="user.displayName ?? ''"
              :comment-karma="user.commentKarma ?? 0"
              :discussion-karma="user.discussionKarma ?? 0"
              :account-created="user.createdAt ?? ''"
            />
          </nuxt-link>
  
          <nuxt-link
            v-if="user.RelatedIssue"
            class="flex rounded border border-blue-500 px-2 py-1 text-blue-500 items-center gap-1"
            :to="{ name: 'forums-forumId-issues-issueId', params: { issueId: user.RelatedIssue?.id } }"
          >
            Related Issue
          </nuxt-link>
        </div>
      </div>
    </div>
  </div>
</template>
