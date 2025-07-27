<script lang="ts" setup>
import type { PropType } from "vue";
import { computed } from "vue";
import type { Channel, Tag as TagData } from "@/__generated__/graphql";
import HighlightedSearchTerms from "@/components/HighlightedSearchTerms.vue";
import Tag from "@/components/TagComponent.vue";
import CalendarIcon from "@/components/icons/CalendarIcon.vue";
import DiscussionIcon from "@/components/icons/DiscussionIcon.vue";

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
  <div
    class="break-inside-avoid dark:text-gray-200 p-4 bg-white dark:bg-black md:mb-4 md:border md:border-gray-300 md:dark:border-gray-500 md:rounded-lg md:shadow-sm md:bg-white md:dark:bg-gray-900"
  >
    <nuxt-link
      :to="`/forums/${channel.uniqueName}/discussions`"
      class="block mb-2"
    >
      <AvatarComponent
        :text="channel.uniqueName"
        :src="channel?.channelIconURL || ''"
        :is-small="true"
        :square="true"
        class="mb-2"
      />
      <div>
        <h3
          v-if="channel.displayName"
          class="font-bold text-gray-700 dark:text-gray-200 break-words"
        >
          <HighlightedSearchTerms
            :text="channel.displayName"
            :search-input="searchInput"
          />
        </h3>
        <p class="text-gray-400 dark:text-gray-300 text-sm break-words">
          <HighlightedSearchTerms
            :text="channel.uniqueName"
            :search-input="searchInput"
          />
        </p>
      </div>
    </nuxt-link>
    <p
      v-if="channel.description"
      class="text-gray-500 dark:text-gray-400 text-sm mb-2 break-words"
    >
      <HighlightedSearchTerms
        :text="channel.description"
        :search-input="searchInput"
      />
    </p>
    <div class="flex gap-1 mb-2">
      <Tag
        v-for="tag in tags"
        :key="tag"
        :active="selectedTags.includes(tag)"
        :tag="tag"
        @click="$emit('filterByTag', tag)"
      />
    </div>
    <div class="flex justify-between text-sm">
      <nuxt-link
        :to="`/forums/${channel.uniqueName}/discussions`"
        class="flex items-center gap-1"
      >
        <DiscussionIcon class="h-4 w-4" />
        {{ channel?.DiscussionChannelsAggregate?.count || 0 }} Discussions
      </nuxt-link>
      <nuxt-link
        v-if="channel?.EventChannelsAggregate?.count"
        :to="`/forums/${channel.uniqueName}/events`"
        class="flex items-center gap-1"
      >
        <CalendarIcon class="h-4 w-4" />
        {{ channel?.EventChannelsAggregate?.count || 0 }} Events
      </nuxt-link>
    </div>
  </div>
</template>

<style scoped>
.break-inside-avoid {
  break-inside: avoid;
}
</style>
