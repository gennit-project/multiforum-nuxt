<script lang="ts">
  import { defineComponent } from "vue";

  export default defineComponent({
    name: "ChannelLink",
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
  <nuxt-link
    :to="{
      name: 'forums-forumId-events-eventId',
      params: {
        eventId,
        forumId: channelId,
      },
    }"
  >
    <li class="flex items-center gap-3 rounded-md bg-gray-100 px-4 py-2 dark:bg-gray-700">
      <AvatarComponent
        class="shadow-sm"
        :is-small="true"
        :is-square="false"
        :src="channelIcon ?? ''"
        :text="channelId"
      />
      <div class="flex-col space-y-1 text-xs">
        <div
          v-if="channelDisplayName"
          class="font-bold"
        >
          {{ channelDisplayName }}
        </div>
        <div :class="[channelDisplayName ? 'font-mono' : 'font-mono font-bold']">
          {{ channelId }}
        </div>
      </div>
    </li>
  </nuxt-link>
</template>
