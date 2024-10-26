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
  <tr class="border-b dark:border-gray-600">
    <td class="px-4 py-2">
      <nuxt-link :to="`/forums/${channel.uniqueName}/discussions`" class="flex items-center gap-2">
        <AvatarComponent
          :text="channel.uniqueName"
          :src="channel?.channelIconURL || ''"
          :is-small="true"
          :square="true"
        />
        <div>
          <div v-if="channel?.displayName" class="font-bold text-wrap text-gray-700 dark:text-gray-200">
            <HighlightedSearchTerms :text="channel.displayName" :search-input="searchInput" />
          </div>
          <span class="text-gray-400 dark:text-gray-300 text-wrap font-xs font-mono">
            <HighlightedSearchTerms :text="channel.uniqueName" :search-input="searchInput" />
          </span>
        </div>
      </nuxt-link>
    </td>
    <td class="px-4 py-2 text-center">
      <nuxt-link
        :to="`/forums/${channel.uniqueName}/discussions`"
        class="flex items-center justify-center gap-1"
      >
        <DiscussionIcon class="h-4 w-4" />
        {{ channel?.DiscussionChannelsAggregate?.count || 0 }}
      </nuxt-link>
    </td>
    <td class="px-4 py-2 text-center">
      <nuxt-link
        v-if="channel?.EventChannelsAggregate?.count"
        :to="`/forums/${channel.uniqueName}/events/search`"
        class="flex items-center justify-center gap-1"
      >
        <CalendarIcon class="h-4 w-4" />
        {{ channel?.EventChannelsAggregate?.count || 0 }}
      </nuxt-link>
    </td>
    <td class="px-4 py-2">
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
  </tr>
</template>

<style scoped></style>
