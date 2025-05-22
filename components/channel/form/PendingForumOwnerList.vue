<script setup lang="ts">
  import { computed } from "vue";
  import { GET_PENDING_CHANNEL_OWNERS_BY_CHANNEL } from "@/graphQLData/mod/queries";
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
    GET_PENDING_CHANNEL_OWNERS_BY_CHANNEL,
    () => ({
      channelUniqueName: forumId.value,
    }),
    {
      fetchPolicy: "cache-first",
    }
  );
  const invites = computed(() => result.value?.channels[0]?.PendingOwnerInvites ?? []);

  defineEmits(["click-cancel-invite"]);
</script>
<template>
  <div class="flex flex-col gap-3 py-3 dark:text-white">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error</div>
    <div
      v-else-if="
        result?.channels?.length === 0 || result.channels[0]?.PendingOwnerInvites?.length === 0
      "
      class="text-sm"
    >
      This forum has no pending owner invites.
    </div>
    <div
      v-if="invites && invites.length > 0"
      class="flex-col text-sm"
    >
      <div
        v-for="invite in invites"
        :key="invite.username"
        class="flex items-center justify-between rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <nuxt-link
          class="flex items-center font-bold dark:text-white"
          :to="{ name: 'u-username', params: { username: invite.username } }"
        >
          <AvatarComponent
            class="mr-2 h-6 w-6"
            :src="invite.profilePicURL ?? ''"
            :text="invite.username"
          />
          <UsernameWithTooltip
            v-if="invite.username"
            :account-created="invite.createdAt ?? ''"
            :comment-karma="invite.commentKarma ?? 0"
            :discussion-karma="invite.discussionKarma ?? 0"
            :display-name="invite.displayName ?? ''"
            :src="invite.profilePicURL ?? ''"
            :username="invite.username"
          />
        </nuxt-link>

        <button
          class="flex items-center gap-1 rounded border border-orange-500 px-2 py-1 text-orange-500"
          type="button"
          @click="$emit('click-cancel-invite', invite.username)"
        >
          Cancel Invite
        </button>
      </div>
    </div>
  </div>
</template>
