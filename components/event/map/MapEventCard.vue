<script setup lang="ts">
import { computed } from 'vue';
import { DateTime } from 'luxon';
import { MapPin, Clock, Repeat } from 'lucide-vue-next';
import type { Event } from '@/__generated__/graphql';
import { getDatePieces } from '@/utils';
import SeriesOccurrenceButtons from '../list/SeriesOccurrenceButtons.vue';
import AppImage from '@/components/image/AppImage.vue';
import HighlightedSearchTerms from '@/components/HighlightedSearchTerms.vue';

const props = withDefaults(
  defineProps<{
    event: Event;
    searchInput?: string;
    selectedTags?: string[];
    isHighlighted?: boolean;
  }>(),
  { searchInput: '', selectedTags: () => [], isHighlighted: false }
);

const emit = defineEmits<{
  openPreview: [];
  filterByTag: [tag: string];
}>();

const start = computed(() => DateTime.fromISO(props.event.startTime));
const time = computed(
  () => getDatePieces(start.value, Boolean(props.event.isAllDay)).timeOfDay
);
const archived = computed(() =>
  props.event.EventChannels.some((channel) => channel.archived)
);
const multipleDays = computed(
  () =>
    Math.abs(
      start.value.diff(DateTime.fromISO(props.event.endTime), 'hours').hours
    ) > 24
);
</script>

<template>
  <li
    class="relative overflow-hidden rounded-xl border bg-white transition-colors dark:bg-gray-900"
    :class="
      isHighlighted
        ? 'border-brand-600 ring-brand-600 dark:border-brand-400 dark:ring-brand-400 ring-1'
        : 'border-gray-200 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500'
    "
    :data-testid="`event-list-item-${event.title}`"
  >
    <button
      type="button"
      :aria-label="`Preview ${event.title}`"
      class="focus-visible:ring-brand-500 flex w-full items-start gap-3 rounded-lg p-3 text-left focus-visible:ring-2 focus-visible:ring-inset"
      @click="emit('openPreview')"
    >
      <time
        :datetime="event.startTime"
        class="flex w-12 shrink-0 flex-col items-center rounded-lg border border-gray-200 bg-gray-50 py-2 dark:border-gray-700 dark:bg-gray-950"
      >
        <span
          class="text-brand-700 dark:text-brand-300 text-[11px] font-semibold uppercase"
          >{{ start.toFormat('ccc') }}</span
        >
        <span
          class="text-2xl leading-tight font-bold text-gray-950 dark:text-white"
          >{{ start.toFormat('d') }}</span
        >
        <span
          class="text-[11px] font-medium text-gray-600 uppercase dark:text-gray-300"
          >{{ start.toFormat('LLL') }}</span
        >
        <span class="sr-only">{{ start.toFormat('yyyy') }}</span>
      </time>
      <span class="min-w-0 flex-1">
        <span
          class="block text-base leading-snug font-semibold text-gray-950 dark:text-white"
          data-testid="event-title"
        >
          <HighlightedSearchTerms
            :text="event.title"
            :search-input="searchInput"
          />
        </span>
        <span
          v-if="event.locationName"
          class="mt-2 flex items-start gap-1.5 text-sm text-gray-600 dark:text-gray-300"
        >
          <MapPin class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {{ event.locationName }}
        </span>
        <span
          class="mt-1 flex items-start gap-1.5 text-sm text-gray-600 dark:text-gray-300"
        >
          <Clock class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {{ time }}<span v-if="multipleDays"> · Multiple days</span>
        </span>
        <span
          class="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium"
        >
          <span v-if="event.canceled" class="text-red-700 dark:text-red-300"
            >Canceled</span
          >
          <span v-if="archived" class="text-red-700 dark:text-red-300"
            >Archived</span
          >
          <span v-if="event.free" class="text-green-800 dark:text-green-300"
            >Free</span
          >
          <span
            v-if="event.EventSeries?.id"
            class="flex items-center gap-1 text-gray-600 dark:text-gray-300"
            ><Repeat class="h-3.5 w-3.5" aria-hidden="true" /> Series</span
          >
        </span>
      </span>
      <AppImage
        v-if="event.coverImageURL"
        :src="event.coverImageURL"
        alt=""
        class="h-20 w-20 shrink-0 rounded-lg object-cover xl:h-24 xl:w-28"
        :width="112"
        :height="96"
        sizes="112px"
      />
    </button>
    <div
      v-if="event.Tags.length"
      class="flex flex-wrap gap-2 px-3 pb-3 pl-[4.5rem]"
    >
      <button
        v-for="tag in event.Tags"
        :key="tag.text"
        type="button"
        :aria-pressed="selectedTags.includes(tag.text)"
        class="focus-visible:ring-brand-500 min-h-8 rounded-md border px-2 py-1 text-xs font-medium focus-visible:ring-2"
        :class="
          selectedTags.includes(tag.text)
            ? 'border-brand-600 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-300'
            : 'border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
        "
        @click="emit('filterByTag', tag.text)"
      >
        {{ tag.text }}
      </button>
    </div>
    <SeriesOccurrenceButtons
      v-if="
        event.EventSeries?.Occurrences &&
        event.EventSeries.Occurrences.length > 1
      "
      :occurrences="event.EventSeries.Occurrences"
      :current-event-id="event.id"
      :channel-unique-name="event.EventChannels[0]?.channelUniqueName || ''"
      class="px-3 pb-3 pl-[4.5rem]"
    />
  </li>
</template>
