<script lang="ts">
import type { PropType } from "vue";
import { defineComponent } from "vue";
import type { Channel as ChannelData } from "@/__generated__/graphql";
import Tag from "../../TagComponent.vue";

export default defineComponent({
  name: "CrosspostList",
  components: { Tag },
  props: {
    channelLinks: {
      type: Array as PropType<ChannelData[]>,
      default: () => {
        return [];
      },
    },
    discussionId: {
      type: String,
      required: true,
    },
    getCommentCount: {
      type: Function,
      default: () => {
        return 0;
      },
    },
  },
  setup() {},
});
</script>

<template>
  <div
    class="rounded-lg space-y-4 shadow-md   text-gray-900 p-4 mr-4 narrow"
  >
    <div class="text-lg mb-2">
      Crossposted To Channels
    </div>

    <ul class="list-disc pl-3">
      <li
        v-for="channel in channelLinks"
        :key="channel.uniqueName"
      >
        <nuxt-link
          class="mr-1 underline"
          :to="{
            name: 'forums-forumId-discussions-discussionId',
            params: {
              discussionId,
              forumId: channel.uniqueName,
            },
          }"
        >
          {{ `${getCommentCount(channel.uniqueName)} comments` }}
        </nuxt-link>
        in
        <nuxt-link
          :to="{
            name: 'forums-forumId-discussions-discussionId',
            params: {
              discussionId,
              forumId: channel.uniqueName,
            },
          }"
        >
          <Tag
            class="mt-2"
            :tag="channel.uniqueName"
            :channel-mode="true"
          />
        </nuxt-link>
      </li>
    </ul>
  </div>
</template>

<style>
.narrow { 
    max-width: 300px;
}
</style>