<script setup lang="ts">
import { computed, nextTick } from "vue";
import { DateTime } from "luxon";
import { getDatePieces } from "@/utils";
import Tag from "@/components/TagComponent.vue";
import HighlightedSearchTerms from "@/components/HighlightedSearchTerms.vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import type { PropType } from "vue";
import type { Event } from "@/__generated__/graphql";
import type { SearchEventValues } from "@/types/Event";
import { useRoute, useRouter } from "nuxt/app";

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
    default: "",
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
});

const emit = defineEmits(["openPreview"]);

const route = useRoute();
const router = useRouter();
const startTimeObj = DateTime.fromISO(props.event.startTime);

const { timeOfDay } = getDatePieces(startTimeObj);

const defaultUniqueName = computed(() => {
  if (props.currentChannelId) {
    return props.currentChannelId;
  }
  if (props.event.EventChannels.length > 0) {
    return props.event.EventChannels[0].channelUniqueName || "";
  }
  return "";
});

const detailLink = computed(() => {
  if (!defaultUniqueName.value) {
    return "";
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
      label: `${commentCount} ${commentCount === 1 ? "comment" : "comments"} in ${dc.channelUniqueName}`,
      value: `/forums/${dc.channelUniqueName}/events/${props.event.id}`,
      event: "",
    };
  }).sort((a, b) => b.label.localeCompare(a.label));
});

const truncatedDescription = computed(() => {
  if (!props.event.description) {
    return "";
  }

  if (props.event.description.length > 200) {
    return props.event.description.slice(0, 500) + "...";
  }
  return props.event.description;
});

const isWithinChannel = props.currentChannelId ? true : false;

const handleClickTag = (tagText: string) => {
  const currentQuery = route.query;

  if (currentQuery.tags) {
    if (
      typeof currentQuery.tags === "string" &&
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
    if (value !== undefined && typeof value !== "string") {
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
  if (props.currentChannelId || route.name === "events-list-search") {
    await nextTick();
    router.push(detailLink.value);
  } else {
    emit("openPreview");
  }
};

const isArchived = computed(() => {
  return props.event.EventChannels.some((dc) => dc.archived);
})

const eventSpansMultipleDates = computed(() => {
  return (
    // If the difference between start time and end time is greater than 24 hours
    Math.abs(startTimeObj.diff(DateTime.fromISO(props.event.endTime), "hours").hours) > 24
  );
});

const commentCount = computed(() => props.event?.CommentsAggregate?.count || 0);
const channelCount = computed(() => props.event?.EventChannels.length || 0);
</script>

<template>
  <li
    :ref="`#${event.id}`"
    class="relative py-2 list-none flex justify-between gap-4"
    :data-testid="`event-list-item-${event.title}`"
    @click="handleClick"
  >
    <div class="flex-shrink-0 pt-2">
      <div class="flex w-16 flex-col items-center">
        <div
          class="font-semibold text-xs uppercase text-gray-500 dark:text-gray-200"
        >
          {{
            new Date(event.startTime).toLocaleString("en-US", {
              weekday: "short",
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
            new Date(event.startTime).toLocaleString("en-US", {
              month: "short",
            })
          }}
        </div>
        <div 
          v-if="eventSpansMultipleDates"
          class="mt-2 ml-2 text-xs text-gray-500 dark:text-gray-200 rounded-full px-2 py-1"
        > <span>Multiple Days</span>
        </div>
      </div>
    </div>

    <div class="flex-1 min-w-0">
      <img
        v-if="event.coverImageURL"
        :src="event.coverImageURL"
<<<<<<< HEAD
      >
      <div>
        <router-link
          class="text-md mt-2 flex cursor-pointer flex-wrap items-center gap-2 text-gray-800 hover:text-orange-700 dark:text-gray-200"
          :data-testid="'event-title'"
=======
        alt="Event cover image"
        class="mb-4 max-h-48 rounded-lg block md:hidden"
      >
      <div>
        <router-link
>>>>>>> parent of 666ae3d (Use automated formatting tools)
          :to="detailLink"
          :data-testid="'event-title'"
          class="text-md flex-wrap gap-2 mt-2 flex items-center cursor-pointer text-gray-800 dark:text-gray-200 hover:text-blue-700"
        >
          <HighlightedSearchTerms
            :text="event.title"
            :search-input="searchInput"
          />
          <span
            v-if="isArchived"
            class="text-xs text-red-500 dark:text-red-400 border border-red-500 dark:border-red-400 rounded-full px-2"
            >Archived</span
          >
        </router-link>
        <span
          v-if="event.canceled"
          class="rounded-lg bg-red-100 px-3 ml-2 py-1 text-sm text-red-500 dark:bg-red-500 dark:text-white"
          >Canceled</span
        >
      </div>

      <div class="flex gap-1">
        <div>
          <div class="flex gap-1 flex-wrap">
            <span
              class="flex flex-wrap text-sm text-gray-500 dark:text-gray-200"
            >
              {{
                `${event.locationName || ""}${event.locationName ? " at " : ""}${timeOfDay}`
              }}
            </span>
          </div>
          <p v-if="event.virtualEventUrl" class="text-black dark:text-white text-sm">
            Online event
          </p>
          <p v-if="event.free" class="text-sm font-medium text-gray-600">
            Free
          </p>

          <div
            v-if="truncatedDescription"
            class="my-2 max-w-lg border-l-2 border-gray-400"
          >
            <MarkdownPreview
              :text="truncatedDescription || ''"
              :disable-gallery="true"
              :word-limit="10"
              class="px-2"
            />
          </div>

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

          <nuxt-link
            v-if="
              showDetailLink &&
              event &&
              (isWithinChannel || !submittedToMultipleChannels)
            "
            :to="detailLink"
            class="flex cursor-pointer items-center justify-start gap-1 text-gray-500 dark:text-gray-100"
          >
            <button
              class="rounded-md bg-gray-100 px-4 py-1 hover:bg-gray-200 text-black dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white text-xs"
            >
              <i class="fa-regular fa-comment h-4 w-4 mr-2" />
              <span class="text black text-sm dark:text-white">{{
                `${commentCount}`
              }}</span>
              <span v-if="!isWithinChannel" class="ml-1 text-xs">{{
                `in c/${event.EventChannels[0].channelUniqueName}`
              }}</span>
            </button>
          </nuxt-link>

          <MenuButton
            v-else-if="showDetailLink && event"
            :items="eventDetailOptions"
          >
            <button
              class="-ml-1 flex items-center rounded-md bg-gray-100 px-4 pb-2 pt-2 hover:bg-gray-200 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
            >
              <i class="fa-regular fa-comment mr-2 h-4 w-4" />
              {{
                `${commentCount} ${
                  commentCount === 1 ? "comment" : "comments"
                } in ${channelCount} ${
                  channelCount === 1 ? "channel" : "channels"
                }`
              }}
              <ChevronDownIcon class="-mr-1 ml-2 h-4 w-4" aria-hidden="true" />
            </button>
          </MenuButton>
        </div>

        <div class="flex-shrink-0 hidden md:flex ml-auto rounded-lg mr-2 mt-2">
          <img
            v-if="event.coverImageURL"
            :alt="event.title"
            :src="event.coverImageURL"
<<<<<<< HEAD
=======
            class="h-44 w-44 rounded-lg"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
          >
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
