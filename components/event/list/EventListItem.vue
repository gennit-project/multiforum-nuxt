<script setup lang="ts">
import { computed, nextTick } from 'vue';
import { DateTime } from 'luxon';
import { getDatePieces } from '@/utils';
import Tag from '@/components/TagComponent.vue';
import HighlightedSearchTerms from '@/components/HighlightedSearchTerms.vue';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue';
import type { PropType } from 'vue';
import type { Event } from '@/__generated__/graphql';
import type { SearchEventValues } from '@/types/Event';
import { useRoute, useRouter } from 'nuxt/app';

const props = defineProps({
  event: {
    type: Object as PropType<Event>,
    required: true,
  },
  selectedTags: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  selectedChannels: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  currentChannelId: {
    type: String,
    required: true,
  },
  searchInput: {
    type: String,
    default: '',
  },
  showMap: {
    type: Boolean,
    required: true,
  },
  showDetailLink: {
    type: Boolean,
    required: false,
    default: true,
  },
  isSelectable: {
    type: Boolean,
    default: false,
  },
  selectedEventId: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['openPreview', 'select']);

const route = useRoute();
const router = useRouter();
const startTimeObj = DateTime.fromISO(props.event.startTime);

const { timeOfDay } = getDatePieces(
  startTimeObj,
  Boolean(props.event.isAllDay)
);

const defaultUniqueName = computed(() => {
  if (props.currentChannelId) {
    return props.currentChannelId;
  }
  if (props.event.EventChannels.length > 0) {
    return props.event.EventChannels?.[0]?.channelUniqueName || '';
  }
  return '';
});

const detailLink = computed(() => {
  if (!defaultUniqueName.value) {
    return '';
  }
  return `/forums/${defaultUniqueName.value}/events/${props.event.id}`;
});

const submittedToMultipleChannels = computed(
  () => props.event.EventChannels.length > 1
);

const eventDetailOptions = computed(() => {
  if (!props.event) {
    return [];
  }
  return props.event.EventChannels.map((dc) => {
    const commentCount = dc.CommentsAggregate?.count || 0;
    return {
      label: `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'} in ${dc.channelUniqueName}`,
      value: `/forums/${dc.channelUniqueName}/events/${props.event.id}`,
      event: '',
    };
  }).sort((a, b) => b.label.localeCompare(a.label));
});

const isWithinChannel = props.currentChannelId ? true : false;
const isSelected = computed(() => props.selectedEventId === props.event.id);

const handleClickTag = (tagText: string) => {
  const currentQuery = route.query;

  if (currentQuery.tags) {
    if (
      typeof currentQuery.tags === 'string' &&
      tagText === currentQuery.tags
    ) {
      const newQuery = { ...route.query };
      delete newQuery.tags;

      router.replace({ query: { ...newQuery } });
    } else if (
      Array.isArray(currentQuery.tags) &&
      currentQuery.tags.includes(tagText)
    ) {
      const newQuery = { ...route.query };
      if (Array.isArray(newQuery.tags)) {
        newQuery.tags = newQuery.tags.filter((tag) => tag !== tagText);
      }

      router.replace({ query: { ...newQuery } });
    } else {
      updateFilters({ tags: [tagText] });
    }
  } else {
    updateFilters({ tags: [tagText] });
  }
};

const updateFilters = (params: SearchEventValues) => {
  const existingQuery = route.query;
  const cleanedParams: Record<string, string> = {};

  Object.keys(params).forEach((key) => {
    const typedKey = key as keyof SearchEventValues;
    const value = params[typedKey];
    if (value !== undefined && typeof value !== 'string') {
      cleanedParams[key] = String(value);
    } else if (value !== undefined) {
      cleanedParams[key] = value;
    }
  });
  router.replace({
    query: { ...existingQuery, ...cleanedParams },
  });
};

const handleClick = async () => {
  if (
    props.isSelectable &&
    import.meta.client &&
    window.matchMedia('(min-width: 1024px)').matches
  ) {
    return;
  }
  if (props.currentChannelId || route.name === 'events-list-search') {
    await nextTick();
    router.push(detailLink.value);
  } else {
    emit('openPreview');
  }
};

const handleSelect = () => {
  if (!props.isSelectable) return;
  emit('select', {
    eventId: props.event.id,
    title: props.event.title || '',
  });
};

const isArchived = computed(() => {
  return props.event.EventChannels.some((dc) => dc.archived);
});

const eventSpansMultipleDates = computed(() => {
  return (
    // If the difference between start time and end time is greater than 24 hours
    Math.abs(
      startTimeObj.diff(DateTime.fromISO(props.event.endTime), 'hours').hours
    ) > 24
  );
});

const commentCount = computed(() => props.event?.CommentsAggregate?.count || 0);
const channelCount = computed(() => props.event?.EventChannels.length || 0);
</script>

<template>
  <li
    :ref="`#${event.id}`"
    class="relative flex list-none justify-between gap-4 bg-white py-2 dark:bg-black"
    :data-testid="`event-list-item-${event.title}`"
    @click="handleClick"
  >
    <div class="flex-shrink-0 pt-2">
      <div class="flex w-16 flex-col items-center">
        <div
          class="font-semibold text-xs uppercase text-gray-500 dark:text-orange-400"
        >
          {{
            new Date(event.startTime).toLocaleString('en-US', {
              weekday: 'short',
            })
          }}
        </div>
        <div class="text-2xl font-bold text-black dark:text-white">
          {{ new Date(event.startTime).getDate() }}
        </div>
        <div
          class="font-semibold text-xs lowercase text-gray-500 dark:text-gray-200"
        >
          {{
            new Date(event.startTime).toLocaleString('en-US', {
              month: 'short',
            })
          }}
        </div>
        <div
          v-if="eventSpansMultipleDates"
          class="ml-2 mt-2 rounded-full px-2 py-1 text-xs text-gray-500 dark:text-gray-200"
        >
          <span>Multiple Days</span>
        </div>
      </div>
    </div>

    <div class="min-w-0 flex-1">
      <img
        v-if="event.coverImageURL"
        :src="event.coverImageURL"
        alt="Event cover image"
        class="mb-4 block max-h-48 rounded-lg md:hidden"
      >
      <!-- Title and image section for medium+ screens -->
        <div class="hidden md:flex md:items-start md:gap-4">
          <div class="flex-1">
            <router-link
              :to="detailLink"
              :data-testid="'event-title'"
              class="text-md mt-2 flex cursor-pointer flex-wrap items-center gap-2 text-gray-800 hover:text-orange-700 dark:text-gray-200 lg:hidden"
              @click="handleSelect"
            >
              <HighlightedSearchTerms
                :text="event.title"
                :search-input="searchInput"
              />
              <span
                v-if="isArchived"
                class="rounded-full border border-red-500 px-2 text-xs text-red-500 dark:border-red-400 dark:text-red-400"
                >Archived</span
              >
            </router-link>
            <button
              type="button"
              class="text-md mt-2 hidden w-full cursor-pointer flex-wrap items-center gap-2 text-left text-gray-800 hover:text-orange-700 dark:text-gray-200 lg:flex"
              @click="handleSelect"
            >
              <span
                :class="
                  isSelected
                    ? 'rounded bg-gray-100 px-1 dark:bg-gray-700'
                    : ''
                "
                class="cursor-pointer"
              >
                <HighlightedSearchTerms
                  :text="event.title"
                  :search-input="searchInput"
                />
              </span>
              <span
                v-if="isArchived"
                class="rounded-full border border-red-500 px-2 text-xs text-red-500 dark:border-red-400 dark:text-red-400"
                >Archived</span
              >
            </button>
          <span
            v-if="event.canceled"
            class="ml-2 rounded-lg bg-red-100 px-3 py-1 text-sm text-red-500 dark:bg-red-500 dark:text-white"
            >Canceled</span
          >

          <!-- Location and time info right under title -->
          <div class="mt-1 flex flex-wrap gap-1">
            <span
              class="flex flex-wrap text-sm text-gray-500 dark:text-gray-200"
            >
              {{
                `${event.locationName || ''}${event.locationName ? ' at ' : ''}${timeOfDay}`
              }}
            </span>
          </div>
          <p
            v-if="event.virtualEventUrl"
            class="text-sm text-black dark:text-white"
          >
            Online event
          </p>
          <p
            v-if="event.free"
            class="text-sm font-medium text-gray-600 dark:text-gray-200"
          >
            Free
          </p>
          <nuxt-link
            v-if="
              showDetailLink &&
              event &&
              (isWithinChannel || !submittedToMultipleChannels)
            "
            :to="detailLink"
            class="mt-1 inline-flex items-center justify-start gap-1 rounded-md bg-gray-100 px-4 py-1 text-xs text-black hover:bg-gray-200 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
          >
            <i class="fa-regular fa-comment mr-2 h-4 w-4" aria-hidden="true" />
            <span class="text black text-sm dark:text-white">{{
              `${commentCount}`
            }}</span>
            <span v-if="!isWithinChannel" class="ml-1 text-xs">{{
              `in c/${event.EventChannels?.[0]?.channelUniqueName}`
            }}</span>
          </nuxt-link>

          <MenuButton
            v-else-if="showDetailLink && event"
            :items="eventDetailOptions"
          >
            <span
              class="-ml-1 mt-1 inline-flex items-center rounded-md bg-gray-100 px-4 pb-2 pt-2 text-sm text-black hover:bg-gray-200 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
            >
              <i
                class="fa-regular fa-comment mr-2 h-4 w-4"
                aria-hidden="true"
              />
              {{
                `${commentCount} ${
                  commentCount === 1 ? 'comment' : 'comments'
                } in ${channelCount} ${
                  channelCount === 1 ? 'channel' : 'channels'
                }`
              }}
              <ChevronDownIcon class="-mr-1 ml-2 h-4 w-4" aria-hidden="true" />
            </span>
          </MenuButton>
        </div>

        <div v-if="event.coverImageURL" class="flex-shrink-0 pr-2">
          <img
            :alt="event.title"
            :src="event.coverImageURL"
            class="h-32 w-32 rounded-lg"
          >
        </div>
      </div>
      <!-- Title section for small screens -->
      <div class="block md:hidden">
        <router-link
          :to="detailLink"
          :data-testid="'event-title'"
          class="text-md mt-2 flex cursor-pointer flex-wrap items-center gap-2 text-gray-800 hover:text-orange-700 dark:text-gray-200"
          @click="handleSelect"
        >
          <HighlightedSearchTerms
            :text="event.title"
            :search-input="searchInput"
          />
          <span
            v-if="isArchived"
            class="rounded-full border border-red-500 px-2 text-xs text-red-500 dark:border-red-400 dark:text-red-400"
            >Archived</span
          >
        </router-link>
        <span
          v-if="event.canceled"
          class="ml-2 rounded-lg bg-red-100 px-3 py-1 text-sm text-red-500 dark:bg-red-500 dark:text-white"
          >Canceled</span
        >

        <!-- Location and time info right under title -->
        <div class="mt-1 flex flex-wrap gap-1">
          <span class="flex flex-wrap text-sm text-gray-500 dark:text-gray-200">
            {{
              `${event.locationName || ''}${event.locationName ? ' at ' : ''}${timeOfDay}`
            }}
          </span>
        </div>
        <p
          v-if="event.virtualEventUrl"
          class="text-sm text-black dark:text-white"
        >
          Online event
        </p>
        <p
          v-if="event.free"
          class="text-sm font-medium text-gray-600 dark:text-gray-200"
        >
          Free
        </p>
      </div>

      <div class="flex gap-1">
        <div>
          <p
            class="mt-1 flex space-x-1 text-sm font-medium text-gray-600 hover:no-underline"
          >
            <Tag
              v-for="tag in event.Tags"
              :key="`tag-${tag.text}`"
              class="my-1"
              :active="selectedTags.includes(tag.text)"
              :tag="tag.text"
              @click="
                () => {
                  handleClickTag(tag.text);
                }
              "
            />
          </p>
        </div>
      </div>
    </div>
  </li>
</template>

<style>
.highlighted {
  background-color: #f9f95d;
}
</style>
