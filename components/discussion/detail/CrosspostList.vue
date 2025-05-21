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
  <div class="narrow mr-4 space-y-4 rounded-lg p-4 text-gray-900 shadow-md">
    <div class="mb-2 text-lg">Crossposted To Channels</div>

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
            :channel-mode="true"
            class="mt-2"
            :tag="channel.uniqueName"
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
