<script setup lang="ts">
  import { computed } from "vue";
  import { relativeTime } from "@/utils";
  import Tag from "@/components/TagComponent.vue";
  import HighlightedSearchTerms from "@/components/HighlightedSearchTerms.vue";
  import type { Event } from "@/__generated__/graphql";
  import type { TagData } from "../../types/Tag";
  import { useRouter } from "nuxt/app";

  const props = defineProps({
    event: {
      type: Object as () => Event,
      required: true,
    },
    searchInput: {
      type: String,
      default: "",
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

  defineEmits(["filterByTag"]);

  const router = useRouter();

  // Computed property for defaultUniqueName
  const defaultUniqueName = computed(() => {
    if (!props.event.EventChannels || !props.event.EventChannels[0]) {
      return "";
    }
    return props.event.EventChannels[0].channelUniqueName;
  });

  const title = props.event.title;
  const relativeTimeText = relativeTime(props.event.createdAt);
  const poster = props.event.Poster ? props.event.Poster.username : "Deleted";
  const tags = (props.event.Tags ?? []).map((tag: TagData) => tag.text);
</script>

<template>
  <li
    class="relative cursor-pointer list-none rounded-lg bg-white p-4 dark:bg-gray-800 dark:text-white"
    @click="
      () => {
        if (defaultUniqueName) {
          router.push(`/forums/${defaultUniqueName}/events/${event.id}`);
        }
      }
    "
  >
    <p class="text-md">
      <HighlightedSearchTerms
        :search-input="searchInput"
        :text="title"
      />
    </p>

    <p class="flex text-xs font-medium text-gray-600 no-underline dark:text-gray-300">
      <Tag
        v-for="tag in tags"
        :key="tag"
        :active="selectedTags.includes(tag)"
        class="my-1"
        :tag="tag"
        @click="$emit('filterByTag', tag)"
      />
    </p>

    <p class="text-xs font-medium text-gray-600 no-underline dark:text-gray-300">
      {{ `Posted ${relativeTimeText} by ${poster}` }}
    </p>

    <div
      v-for="(ec, i) in event.EventChannels"
      :key="i"
      class="my-2 space-x-2 text-sm"
    >
      <nuxt-link
        v-if="ec.Channel"
        class="text-gray-500 underline hover:text-gray-700 dark:text-gray-300 hover:dark:text-gray-200"
        :to="{
          name: 'forums-forumId-events-eventId',
          params: {
            forumId: ec.Channel.uniqueName,
            eventId: event.id,
          },
        }"
      >
        {{ `c/${ec.Channel.uniqueName}` }}
      </nuxt-link>
    </div>
  </li>
</template>

<style>
  .highlighted {
    background-color: #f9f95d;
  }
</style>
