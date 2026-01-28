<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ChannelLink',
  props: {
    eventId: {
      type: String,
      required: true,
    },
    channelId: {
      type: String,
      required: true,
    },
    channelIcon: {
      type: String,
      required: true,
    },
    channelDisplayName: {
      type: String,
      required: true,
    },
    commentCount: {
      type: Number,
      required: true,
    },
  },
  setup() {
    return {};
  },
});
</script>
<template>
  <li
    class="flex items-center gap-3 rounded-md bg-gray-100 px-4 py-2 dark:bg-gray-700"
  >
    <nuxt-link
      class="flex w-full items-center gap-3"
      :to="{
        name: 'forums-forumId-events-eventId',
        params: {
          eventId,
          forumId: channelId,
        },
      }"
    >
      <AvatarComponent
        class="shadow-sm"
        :text="channelId"
        :src="channelIcon ?? ''"
        :is-small="true"
        :is-square="false"
        :is-decorative="true"
      />
      <div class="flex-col space-y-1 text-xs">
        <div v-if="channelDisplayName" class="font-bold">
          {{ channelDisplayName }}
        </div>
        <div
          :class="[channelDisplayName ? 'font-mono' : 'font-mono font-bold']"
        >
          {{ channelId }}
        </div>
      </div>
    </nuxt-link>
  </li>
</template>
