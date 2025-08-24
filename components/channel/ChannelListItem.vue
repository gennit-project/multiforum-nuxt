<script lang="ts" setup>
import type { PropType } from 'vue';
import { computed } from 'vue';
import type { Channel, Tag as TagData } from '@/__generated__/graphql';
import HighlightedSearchTerms from '@/components/HighlightedSearchTerms.vue';
import Tag from '@/components/TagComponent.vue';
import CalendarIcon from '@/components/icons/CalendarIcon.vue';
import DiscussionIcon from '@/components/icons/DiscussionIcon.vue';
import DownloadIcon from '@/components/icons/DownloadIcon.vue';

const props = defineProps({
  channel: {
    type: Object as PropType<Channel>,
    required: true,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  searchInput: {
    type: String,
    default: '',
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
  <div
    class="break-inside-avoid bg-white p-4 dark:bg-black dark:text-gray-200 md:mb-4 md:rounded-lg md:border md:border-gray-300 md:bg-white md:shadow-sm md:dark:border-gray-500 md:dark:bg-gray-900"
  >
    <nuxt-link
      :to="`/forums/${channel.uniqueName}/discussions`"
      class="mb-2 block"
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
          class="break-words font-bold text-gray-700 dark:text-gray-200"
        >
          <HighlightedSearchTerms
            :text="channel.displayName"
            :search-input="searchInput"
          />
        </h3>
        <p class="break-words text-sm text-gray-400 dark:text-gray-300">
          <HighlightedSearchTerms
            :text="channel.uniqueName"
            :search-input="searchInput"
          />
        </p>
      </div>
    </nuxt-link>
    <p
      v-if="channel.description"
      class="mb-2 break-words text-sm text-gray-500 dark:text-gray-400"
    >
      <HighlightedSearchTerms
        :text="channel.description"
        :search-input="searchInput"
      />
    </p>
    <div class="mb-2 flex gap-1">
      <Tag
        v-for="tag in tags"
        :key="tag"
        :active="selectedTags.includes(tag)"
        :tag="tag"
        @click="$emit('filterByTag', tag)"
      />
    </div>
    <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      <nuxt-link
        :to="`/forums/${channel.uniqueName}/discussions`"
        class="flex items-center gap-1"
      >
        <DiscussionIcon class="h-4 w-4" />
        {{ channel?.DiscussionChannelsAggregate?.count || 0 }} Discussions
      </nuxt-link>
      <nuxt-link
        v-if="downloadCount > 0"
        :to="`/forums/${channel.uniqueName}/downloads`"
        class="flex items-center gap-1"
      >
        <DownloadIcon class="h-4 w-4" />
        {{ downloadCount }} Downloads
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
