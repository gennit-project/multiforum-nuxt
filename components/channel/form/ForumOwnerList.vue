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

  defineEmits(["click-remove-owner"]);
</script>
<template>
  <div class="flex flex-col gap-3 py-3 dark:text-white">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error</div>
    <div v-else-if="result?.channels?.length === 0 || result.channels[0]?.Admins?.length === 0">
      This forum has no owners.
    </div>
    <div
      v-if="admins && admins.length > 0"
      class="flex-col text-sm"
    >
      <div
        v-for="admin in admins"
        :key="admin.username"
        class="flex items-center justify-between rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <nuxt-link
          class="flex items-center font-bold dark:text-white"
          :to="{ name: 'u-username', params: { username: admin.username } }"
        >
          <AvatarComponent
            class="mr-2 h-6 w-6"
            :src="admin.profilePicURL ?? ''"
            :text="admin.username"
          />
          <UsernameWithTooltip
            v-if="admin.username"
            :account-created="admin.createdAt ?? ''"
            :comment-karma="admin.commentKarma ?? 0"
            :discussion-karma="admin.discussionKarma ?? 0"
            :display-name="admin.displayName ?? ''"
            :src="admin.profilePicURL ?? ''"
            :username="admin.username"
          />
        </nuxt-link>

        <button
          class="flex items-center gap-1 rounded border border-blue-500 px-2 py-1 text-blue-500"
          type="button"
          @click="$emit('click-remove-owner', admin.username)"
        >
          Remove Admin
        </button>
      </div>
    </div>
  </div>
</template>
