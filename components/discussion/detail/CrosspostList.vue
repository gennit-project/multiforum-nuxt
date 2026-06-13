<script setup lang="ts">
import type { Channel as ChannelData } from '@/__generated__/graphql';
import Tag from '../../TagComponent.vue';

interface Props {
  channelLinks?: ChannelData[];
  discussionId: string;
  getCommentCount?: (channelId: string) => number;
}

withDefaults(defineProps<Props>(), {
  channelLinks: () => [],
  getCommentCount: () => 0,
});
</script>

<template>
  <div class="narrow mr-4 space-y-4 rounded-lg p-4 text-gray-900 shadow-md">
    <div class="mb-2 text-lg">Crossposted To Channels</div>

    <ul class="list-disc pl-3">
      <li v-for="channel in channelLinks" :key="channel.uniqueName">
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
          <Tag class="mt-2" :tag="channel.uniqueName" :channel-mode="true" />
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
