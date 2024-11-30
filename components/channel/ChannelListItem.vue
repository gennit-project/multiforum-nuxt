<script lang="ts" setup>
import type { PropType } from "vue";
import { computed } from "vue";
import type { Channel, Tag as TagData } from "@/__generated__/graphql";
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
  <tr class="border border-gray-300 dark:border-gray-800">
    <td class="flex-col px-4 py-2 border border-gray-300 dark:border-gray-800">
      <nuxt-link
        :to="`/forums/${channel.uniqueName}/discussions`"
        class="flex items-center gap-2"
      >
        <AvatarComponent
          :text="channel.uniqueName"
          :src="channel?.channelIconURL || ''"
          :is-small="true"
          :square="true"
        />
        <div>
          <div
            v-if="channel?.displayName"
            class="font-bold text-wrap text-gray-700 dark:text-gray-200"
          >
            <HighlightedSearchTerms
              :text="channel.displayName"
              :search-input="searchInput"
            />
          </div>
          <span
            class="text-gray-400 dark:text-gray-300 text-wrap font-xs font-mono"
          >
            <HighlightedSearchTerms
              :text="channel.uniqueName"
              :search-input="searchInput"
            />
          </span>
        </div>
      </nuxt-link>
      <div
        v-if="channel?.description"
        class="text-gray-500 dark:text-gray-400 break-all"
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
    </td>
    <td
      class="px-4 py-2 text-center border border-gray-300 dark:border-gray-800"
    >
      <nuxt-link
        :to="`/forums/${channel.uniqueName}/discussions`"
        class="flex items-center justify-center gap-1"
      >
        <DiscussionIcon class="h-4 w-4" />
        {{ channel?.DiscussionChannelsAggregate?.count || 0 }}
      </nuxt-link>
    </td>
    <td
      class="px-4 py-2 text-center border border-gray-300 dark:border-gray-800"
    >
      <nuxt-link
        v-if="channel?.EventChannelsAggregate?.count"
        :to="`/forums/${channel.uniqueName}/events/search`"
        class="flex items-center justify-center gap-1"
      >
        <CalendarIcon class="h-4 w-4" />
        {{ channel?.EventChannelsAggregate?.count || 0 }}
      </nuxt-link>
    </td>
  </tr>
</template>

<style scoped></style>
