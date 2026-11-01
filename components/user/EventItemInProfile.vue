<script setup lang="ts">
import { computed } from 'vue';
import { relativeTime } from '@/utils';
import Tag from '@/components/TagComponent.vue';
import HighlightedSearchTerms from '@/components/HighlightedSearchTerms.vue';
import type { GetUserEventsQuery } from '@/__generated__/operations';

import type { NullableSelection } from '@/types/Comment';
import type { UserContributionActivity } from '@/types/contribution';
type Event = NullableSelection<GetUserEventsQuery['users'][number]['Events'][number] | UserContributionActivity['Events'][number]>;

const props = defineProps({
  event: {
    type: Object as () => Event,
    required: true,
  },
  searchInput: {
    type: String,
    default: '',
  },
  selectedTags: {
    type: Array as () => string[],
    default: () => [],
  },
  selectedChannels: {
    type: Array as () => string[],
    default: () => [],
  },
});

defineEmits(['filterByTag']);

// Computed property for defaultUniqueName
const defaultUniqueName = computed(() => {
  if (!props.event.EventChannels || !props.event.EventChannels[0]) {
    return '';
  }
  return props.event.EventChannels[0].channelUniqueName;
});

// Primary link target for the card title, so it is keyboard-reachable instead
// of relying on a click handler on the whole <li>.
const titleLink = computed(() =>
  defaultUniqueName.value && props.event.id
    ? `/forums/${defaultUniqueName.value}/events/${props.event.id}`
    : ''
);

const title = computed(() => props.event.title || '');
const relativeTimeText = relativeTime(props.event.createdAt || '');
const poster = props.event.Poster ? props.event.Poster.username : 'Deleted';
const tags = computed(() => ('Tags' in props.event ? props.event.Tags ?? [] : []).map((tag) => tag.text));
const channels = computed(() => (props.event.EventChannels || []).filter((item) => item !== null));
const channelName = (channel: (typeof channels.value)[number]) => ('Channel' in channel ? channel.Channel?.uniqueName : null) || channel.channelUniqueName || '';
</script>

<template>
  <li
    class="relative list-none rounded-lg bg-gray-100 p-4 dark:bg-gray-800 dark:text-white"
  >
    <p class="text-md">
      <nuxt-link
        v-if="titleLink"
        :to="titleLink"
        class="focus-visible:ring-brand-500 font-medium hover:underline focus:outline-none focus-visible:ring-2"
      >
        <HighlightedSearchTerms :text="title" :search-input="searchInput" />
      </nuxt-link>
      <HighlightedSearchTerms
        v-else
        :text="title"
        :search-input="searchInput"
      />
    </p>

    <p
      class="flex text-xs font-medium text-gray-600 no-underline dark:text-gray-300"
    >
      <Tag
        v-for="tag in tags"
        :key="tag"
        class="my-1"
        :active="selectedTags.includes(tag)"
        :tag="tag"
        @click="$emit('filterByTag', tag)"
      />
    </p>

    <p
      class="text-xs font-medium text-gray-600 no-underline dark:text-gray-300"
    >
      {{ `Posted ${relativeTimeText} by ${poster}` }}
    </p>

    <div
      v-for="(ec, i) in channels"
      :key="i"
      class="my-2 space-x-2 text-sm"
    >
      <nuxt-link
        v-if="channelName(ec)"
        class="text-gray-500 underline hover:text-gray-700 dark:text-gray-300 hover:dark:text-gray-200"
        :to="{
          name: 'forums-forumId-events-eventId',
          params: {
            forumId: channelName(ec),
            eventId: event.id,
          },
        }"
      >
        {{ `c/${channelName(ec)}` }}
      </nuxt-link>
    </div>
  </li>
</template>

<style>
.highlighted {
  background-color: #f9f95d;
}
</style>
