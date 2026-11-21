<script setup lang="ts">
import { getEventRoute } from '@/utils/contentUrls';

defineProps<{
  eventId: string;
  eventNumber?: number | null;
  eventTitle?: string | null;
  channelId: string;
  channelIcon: string;
  channelDisplayName: string;
}>();
</script>
<template>
  <li
    class="flex items-center gap-3 rounded-md bg-gray-100 px-4 py-2 dark:bg-gray-700"
  >
    <nuxt-link
      class="flex w-full items-center gap-3"
      :to="
        getEventRoute({
          forumId: channelId,
          eventNumber,
          title: eventTitle,
          eventId,
        })
      "
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
