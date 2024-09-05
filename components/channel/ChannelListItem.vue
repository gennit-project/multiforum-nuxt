<script lang="ts" setup>
import type { PropType } from "vue";
import { computed } from "vue";
import type { Channel } from "@/__generated__/graphql";
import type { TagData } from "@/types/Tag";
import HighlightedSearchTerms from "@/components/HighlightedSearchTerms.vue";
import Tag from "@/components/TagComponent.vue";
import CalendarIcon from "@/components/icons/CalendarIcon.vue";
import DiscussionIcon from "@/components/icons/DiscussionIcon.vue";

// Define props
const props = defineProps({
  channel: {
    type: Object as PropType<Channel>,
    required: true,
  },
  searchInput: {
    type: String,
    default: "",
  },
  selectedTags: {
    type: Array as PropType<Array<string>>,
    default: () => [],
  },
});

const tags = computed(() => props.channel.Tags.map((tag: TagData) => tag.text));

defineEmits(['filterByTag']);

</script>

<template>
  <div>
    <div
      class="border py-4 md:px-6 border-gray-500 dark:border-gray-600 shadow md:rounded-t-lg bg-white p-3 dark:bg-gray-800 dark:text-gray-200"
    >
      <div class="flex flex-row">
        <NuxtLink
          :to="`/forums/f/${channel.uniqueName}/discussions`"
          class="flex cursor-pointer"
        >
          <div class="h-24 w-24">
            <AvatarComponent
              :text="channel.uniqueName"
              :src="channel?.channelIconURL || ''"
              :is-medium="true"
              :square="true"
            />
          </div>
        </NuxtLink>

        <div class="flex flex-col px-4">
          <NuxtLink
            :to="`/forums/f/${channel.uniqueName}/discussions`"
            class="mt-1 flex cursor-pointer items-center gap-4"
          >
            <h3
              v-if="channel.uniqueName && !channel?.displayName"
              class="mb-2 mt-4 flex border-gray-700 text-2xl font-bold leading-6 text-gray-500 dark:text-gray-200"
            >
              <HighlightedSearchTerms
                :text="channel.uniqueName"
                :search-input="searchInput"
              />
            </h3>
            <div v-if="channel?.displayName">
              <h3
                class="mb-2 flex border-gray-700 text-2xl font-bold leading-6 text-gray-500 dark:text-gray-200"
              >
                <HighlightedSearchTerms
                  :text="channel.displayName"
                  :search-input="searchInput"
                />
              </h3>
              <span
                class="text-sm font-bold font-mono leading-6 text-gray-500 dark:text-gray-300"
              >
                <HighlightedSearchTerms
                  :text="channel.uniqueName"
                  :search-input="searchInput"
                />
              </span>
            </div>
          </NuxtLink>
          <div>
            <div
              v-if="channel.description"
              class="my-1 text-sm flex-wrap font-normal text-gray-600 dark:text-gray-200"
            >
              <HighlightedSearchTerms
                :text="channel.description"
                :search-input="searchInput"
              />
            </div>

            <div class="flex gap-2">
              <Tag
                v-for="tag in tags"
                :key="tag"
                :active="selectedTags.includes(tag)"
                :tag="tag"
                @click="$emit('filterByTag', tag)"
              />
            </div>
          </div>   
        </div>
      </div>
    </div>
    <div class="md:rounded-b-lg bg-gray-500 text-white">
      <div class="flex w-full py-2 px-2">
        <div class="truncate text-xs font-normal">
          <NuxtLink
            class="flex items-center gap-1 rounded-lg px-4 py-2 hover:bg-gray-700"
            :to="`/forums/f/${channel.uniqueName}/discussions`"
          >
            <DiscussionIcon class="h-4 w-4" />
            {{ channel?.DiscussionChannelsAggregate?.count }}
            {{
              channel?.DiscussionChannelsAggregate?.count === 1
                ? "Discussion"
                : "Discussions"
            }}
          </NuxtLink>
        </div>
        <div
          v-if="channel?.EventChannelsAggregate?.count"
          class="truncate text-xs font-normal"
        >
          <NuxtLink
            class="flex items-center gap-1 rounded-lg px-4 py-2 hover:bg-gray-700"
            :to="`/forums/f/${channel.uniqueName}/events/search`"
          >
            <CalendarIcon class="h-4 w-4" />
            {{ channel?.EventChannelsAggregate?.count || 0 }} Upcoming Events
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
