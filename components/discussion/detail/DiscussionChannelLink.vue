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
    <div class="flex items-center flex-wrap gap-1">
      <nuxt-link
        :data-testid="`comments-in-${channelId}`"
        class="underline"
        :to="{
          name: 'forums-forumId-discussions-discussionId',
          params: { discussionId, forumId: channelId },
        }"
      >
        {{ `${commentCount} comments` }}
      </nuxt-link>
      <span>and {{ upvoteCount || 0 }} {{ upvoteCount === 1 ? "upvote" : "upvotes" }} in</span>
      <nuxt-link
        :to="{
          name: 'forums-forumId-discussions-discussionId',
          params: { discussionId, forumId: channelId },
        }"
      >
        <div class="inline-flex items-center gap-2 rounded-md bg-gray-100 px-2 py-1 dark:bg-gray-700">
          <AvatarComponent
<<<<<<< HEAD
            class="shadow-sm dark:border-gray-300"
=======
            class="shadow-sm dark:border-gray-800"
            :text="channelId"
            :src="channelIcon ?? ''"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
            :is-small="true"
            :is-square="false"
          />
          <div class="flex flex-col text-xs">
            <div v-if="channelDisplayName" class="font-bold">{{ channelDisplayName }}</div>
            <div :class="[channelDisplayName ? 'font-mono' : 'font-mono font-bold']">{{ channelId }}</div>
          </div>
        </div>
      </nuxt-link>
    </div>
  </li>
</template>