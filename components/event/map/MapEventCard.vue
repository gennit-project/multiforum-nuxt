<script setup lang="ts">
import { computed } from 'vue';
import { DateTime } from 'luxon';
import { MapPin, Repeat } from 'lucide-vue-next';
import { useRouter } from 'nuxt/app';
import ForumSubmissions from '@/components/discovery/ForumSubmissions.vue';
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
    onlineList?: boolean;
    selectedEventId?: string;
  }>(),
  {
    searchInput: '',
    selectedTags: () => [],
    isHighlighted: false,
    onlineList: false,
    selectedEventId: '',
  }
);

const emit = defineEmits<{
  openPreview: [];
  select: [payload: { eventId: string; title: string }];
  filterByTag: [tag: string];
}>();

const router = useRouter();
const openEvent = () => {
  if (!props.onlineList) return emit('openPreview');
  if (window.matchMedia('(min-width: 1024px)').matches) {
    emit('select', { eventId: props.event.id, title: props.event.title });
  } else {
    router.push(
      `/forums/${encodeURIComponent(props.event.EventChannels[0]?.channelUniqueName || '')}/events/${encodeURIComponent(props.event.id)}`
    );
  }
};
const start = computed(() =>
  DateTime.fromISO(props.event.startTime).setZone('local')
);
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
    class="relative overflow-hidden rounded-xl border bg-white transition-[border-color,box-shadow] dark:bg-gray-900"
    :class="[
      isHighlighted || (onlineList && selectedEventId === event.id)
        ? 'border-brand-600 ring-brand-600 dark:border-brand-400 dark:ring-brand-400 ring-1'
        : 'border-gray-200 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500',
      'shadow-sm hover:shadow-md dark:shadow-none',
    ]"
    :data-testid="`event-list-item-${event.title}`"
  >
    <button
      type="button"
      :aria-label="`Preview ${event.title}`"
      class="focus-visible:ring-brand-500 w-full items-start rounded-lg text-left focus-visible:ring-2 focus-visible:ring-inset"
      :class="
        event.coverImageURL
          ? 'grid grid-cols-[minmax(0,1fr)_5rem] gap-x-3 gap-y-1 p-3 sm:grid-cols-[minmax(0,1fr)_7rem]'
          : 'grid grid-cols-1 gap-y-1 p-3'
      "
      @click="openEvent"
    >
      <span class="col-start-1 row-start-1 min-w-0">
        <time
          :datetime="event.startTime"
          class="flex w-auto shrink-0 items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400"
        >
          <span>{{ start.toFormat('ccc, LLL d') }}</span>
          <span aria-hidden="true">·</span>
          <span class="text-gray-700 dark:text-gray-300">{{ time }}</span>
          <span>{{ start.offsetNameShort }}</span>
          <span v-if="multipleDays">· Multiple days</span>
          <span class="sr-only">{{ start.toFormat('yyyy') }}</span>
        </time>
        <span class="mt-1 block min-w-0">
          <span
            class="block text-base leading-snug font-bold tracking-tight text-gray-950 dark:text-white"
            data-testid="event-title"
          >
            <HighlightedSearchTerms
              :text="event.title"
              :search-input="searchInput"
            />
          </span>
          <span
            v-if="!onlineList && (event.locationName || event.address)"
            class="mt-1 flex items-start gap-1.5 text-sm text-gray-600 dark:text-gray-300"
          >
            <MapPin class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{{ event.locationName || event.address }}</span>
          </span>
          <span
            v-if="
              event.canceled || archived || event.free || event.EventSeries?.id
            "
            class="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium"
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
      </span>
      <AppImage
        v-if="event.coverImageURL"
        :src="event.coverImageURL"
        alt=""
        class="col-start-2 row-start-1 h-20 w-20 shrink-0 self-start rounded-lg object-cover sm:h-24 sm:w-28"
        :width="112"
        :height="96"
        sizes="(min-width: 640px) 112px, 80px"
      />
    </button>
    <div
      v-if="event.Tags.length"
      class="flex flex-wrap gap-2 px-3 pb-2 sm:px-4"
    >
      <button
        v-for="tag in event.Tags"
        :key="tag.text"
        type="button"
        :aria-pressed="selectedTags.includes(tag.text)"
        class="focus-visible:ring-brand-500 min-h-8 rounded-md border px-2 py-1 text-xs focus-visible:ring-2"
        :class="[
          selectedTags.includes(tag.text)
            ? 'border-brand-600 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-300 font-medium'
            : 'border-gray-200 bg-gray-50 font-normal text-gray-600 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-300',
        ]"
        @click="emit('filterByTag', tag.text)"
      >
        {{ tag.text }}
      </button>
    </div>
    <div v-if="event.EventChannels.length" class="px-3 pb-3">
      <ForumSubmissions
        :submissions="event.EventChannels"
        :content-id="event.id"
        kind="event"
        :compact="true"
        :subtle="true"
      />
    </div>
    <SeriesOccurrenceButtons
      v-if="
        event.EventSeries?.Occurrences &&
        event.EventSeries.Occurrences.length > 1
      "
      :occurrences="event.EventSeries.Occurrences"
      :current-event-id="event.id"
      :channel-unique-name="event.EventChannels[0]?.channelUniqueName || ''"
      class="px-3 pb-3 sm:px-4 sm:pb-4"
    />
  </li>
</template>
