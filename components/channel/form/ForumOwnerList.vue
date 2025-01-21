<script setup lang="ts">
import { computed } from "vue";
import { GET_CHANNEL_OWNERS_BY_CHANNEL } from "@/graphQLData/mod/queries";
import { useQuery } from "@vue/apollo-composable";
import { useRoute } from "nuxt/app";

const route = useRoute();
const forumId = computed(() => {
  if (typeof route.params.forumId === "string") {
    return route.params.forumId;
  }
  return "";
});

const { result, loading, error } = useQuery(
    GET_CHANNEL_OWNERS_BY_CHANNEL,
  () => ({
    channelUniqueName: forumId.value,
  }),
  {
    fetchPolicy: "cache-first",
  }
);
const admins = computed(() => result.value?.channels[0]?.Admins);
</script>
<template>
  <div class="flex flex-col gap-3 py-3 dark:text-white">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error</div>
    <div
      v-else-if="
        result?.channels?.length === 0 ||
        result.channels[0]?.Admins?.length === 0
      "
    >
      This forum has no owners.
    </div>
    <div v-if="admins && admins.length > 0" class="flex-col text-sm font-bold">
        <div v-for="admin in admins" :key="admin.username">
          <nuxt-link
            :to="{ name: 'u-username', params: { username: admin.username } }"
            class="flex items-center dark:text-white"
          >
            <AvatarComponent :text="admin.username" :src="admin.profilePicURL ?? ''" class="mr-2 h-6 w-6" />
            <UsernameWithTooltip
              v-if="admin.username"
              :username="admin.username"
              :src="admin.profilePicURL ?? ''"
              :display-name="admin.displayName ?? ''"
              :comment-karma="admin.commentKarma ?? 0"
              :discussion-karma="admin.discussionKarma ?? 0"
              :account-created="admin.createdAt ?? ''"
            />
          </nuxt-link>
        </div>
      </div>
  </div>
</template>
