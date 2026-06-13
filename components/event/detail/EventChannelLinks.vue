<script setup lang="ts">
import { computed } from 'vue';
import EventChannelLink from '@/components/event/detail/EventChannelLink.vue';
import type { EventChannel } from '@/__generated__/graphql';

const props = withDefaults(
  defineProps<{
    channelId?: string;
    eventChannels: EventChannel[];
  }>(),
  {
    channelId: '',
  }
);

const channelsExceptActive = computed(() => {
  return props.eventChannels.filter((dc) => {
    return dc.channelUniqueName !== props.channelId;
  });
});
</script>

<template>
  <div>
    <div v-if="!channelId" class="my-4">
      <h2 class="text-md">This event was submitted to the following forums:</h2>

      <ul>
        <EventChannelLink
          v-for="eventChannel in eventChannels"
          :key="eventChannel.id"
          :channel-id="eventChannel.channelUniqueName"
          :channel-icon="eventChannel.Channel?.channelIconURL || ''"
          :channel-display-name="eventChannel.Channel?.displayName || ''"
          :comment-count="eventChannel.CommentsAggregate?.count || 0"
          :event-id="eventChannel.eventId"
        />
      </ul>
    </div>

    <div v-if="channelId && channelsExceptActive.length > 0">
      <div>
        <h2 class="mt-4 text-lg">Other forums this event was submitted to:</h2>
        <ul>
          <EventChannelLink
            v-for="dc in channelsExceptActive"
            :key="dc.id"
            :channel-id="dc.channelUniqueName"
            :channel-icon="dc.Channel?.channelIconURL || ''"
            :channel-display-name="dc.Channel?.displayName || ''"
            :comment-count="dc.CommentsAggregate?.count || 0"
            :event-id="dc.eventId"
          />
        </ul>
        <p v-if="channelsExceptActive.length === 0" class="text-sm">
          The event was not submitted to any other forums.
        </p>
      </div>
    </div>
  </div>
</template>
