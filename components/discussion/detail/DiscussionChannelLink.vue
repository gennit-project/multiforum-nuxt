<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ChannelLink",
  props: {
    channelDisplayName: {
      type: String,
      default: "",
    },
    channelIcon: {
      type: String,
      default: "",
    },
    discussionId: {
      type: String,
      required: true,
    },
    channelId: {
      type: String,
      required: true,
    },
    commentCount: {
      type: Number,
      required: true,
    },
    upvoteCount: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  setup() {
    return {};
  },
});
</script>
<template>
  <li>
    <div class="flex items-center space-x-1">
      <router-link
        :data-testid="`comments-in-${channelId}`"
        class="mr-1 underline"
        :to="{
          name: 'DiscussionDetail',
          params: {
            discussionId,
            channelId,
          },
        }"
      >
        {{ `${commentCount} comments` }}
      </router-link>
      and {{ upvoteCount || 0 }}
      {{ upvoteCount === 1 ? "upvote" : "upvotes" }} in

      <router-link
        :to="{
          name: 'DiscussionDetail',
          params: {
            discussionId,
            channelId,
          },
        }"
      >
        <div
          class="flex items-center gap-3 rounded-md bg-gray-100 px-4 py-2 dark:bg-gray-700"
        >
          <Avatar
            class="h-24 w-24 border-2 shadow-sm dark:border-gray-800"
            :text="channelId"
            :src="channelIcon ?? ''"
            :is-small="true"
            :is-square="false"
          />
          <div class="flex-col space-y-1 text-xs">
            <div
              v-if="channelDisplayName"
              class="font-bold"
            >
              {{ channelDisplayName }}
            </div>
            <div
              :class="[
                channelDisplayName ? 'font-mono' : 'font-mono font-bold',
              ]"
            >
              {{ channelId }}
            </div>
          </div>
        </div>
      </router-link>
    </div>
  </li>
</template>
