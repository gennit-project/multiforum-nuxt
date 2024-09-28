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

defineEmits(["filterByTag"]);
</script>

<template>
  <div>
    <div
      class="border py-2 md:px-4 border-gray-500 dark:border-gray-600 shadow md:rounded-t-lg bg-white p-2 dark:bg-gray-800 dark:text-gray-200"
    >
      <div class="flex flex-row">
        <nuxt-link
          :to="`/forums/${channel.uniqueName}/discussions`"
          class="flex cursor-pointer"
        >
          <AvatarComponent
            :text="channel.uniqueName"
            :src="channel?.channelIconURL || ''"
            :is-medium="true"
            :square="true"
          />
        </nuxt-link>

        <div class="flex flex-col px-2">
          <nuxt-link
            :to="`/forums/${channel.uniqueName}/discussions`"
            class="mt-1 flex cursor-pointer items-center gap-2"
          >
            <h3
              v-if="channel.uniqueName && !channel?.displayName"
              class="mb-1 mt-2 text-xl font-bold text-gray-500 dark:text-gray-200"
            >
              <HighlightedSearchTerms
                :text="channel.uniqueName"
                :search-input="searchInput"
              />
            </h3>
            <div v-if="channel?.displayName">
              <h3
                class="mb-1 text-xl font-bold text-gray-500 dark:text-gray-200"
              >
                <HighlightedSearchTerms
                  :text="channel.displayName"
                  :search-input="searchInput"
                />
              </h3>
              <span
                class="text-xs font-mono font-bold text-gray-500 dark:text-gray-300"
              >
                <HighlightedSearchTerms
                  :text="channel.uniqueName"
                  :search-input="searchInput"
                />
              </span>
            </div>
          </nuxt-link>

          <div>
            <div
              v-if="channel.description"
              class="my-1 text-xs text-gray-600 dark:text-gray-200"
            >
              <HighlightedSearchTerms
                :text="channel.description"
                :search-input="searchInput"
              />
            </div>

            <div class="flex gap-1">
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
      <div class="flex w-full py-1 px-1">
        <div class="truncate text-xs">
          <nuxt-link
            class="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-gray-700"
            :to="`/forums/${channel.uniqueName}/discussions`"
          >
            <DiscussionIcon class="h-3 w-3" />
            {{ channel?.DiscussionChannelsAggregate?.count }}
            {{
              channel?.DiscussionChannelsAggregate?.count === 1
                ? "Discussion"
                : "Discussions"
            }}
          </nuxt-link>
        </div>
        <div
          v-if="channel?.EventChannelsAggregate?.count"
          class="truncate text-xs"
        >
          <nuxt-link
            class="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-gray-700"
            :to="`/forums/${channel.uniqueName}/events/search`"
          >
            <CalendarIcon class="h-3 w-3" />
            {{ channel?.EventChannelsAggregate?.count || 0 }} Upcoming Events
          </nuxt-link>
        </div>
      </div>
    </div>
  </div>
</template>
