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
    class="hover:bg-gray-50 bg-white px-6 py-4 dark:bg-black dark:text-gray-200 dark:hover:bg-gray-900"
  >
    <div class="flex items-start gap-4">
      <!-- Avatar -->
      <div class="flex-shrink-0">
        <nuxt-link :to="`/forums/${channel.uniqueName}/discussions`">
          <AvatarComponent
            :text="channel.uniqueName"
            :src="channel?.channelIconURL || ''"
            :is-small="false"
            :square="true"
            class="h-12 w-12"
          />
        </nuxt-link>
      </div>

      <!-- Main content -->
      <div class="min-w-0 flex-1">
        <!-- Forum name and unique name -->
        <div class="mb-1">
          <nuxt-link
            :to="`/forums/${channel.uniqueName}/discussions`"
            class="block hover:underline"
          >
            <h3
              v-if="channel.displayName"
              class="font-semibold text-lg text-gray-900 dark:text-gray-100"
            >
              <HighlightedSearchTerms
                :text="channel.displayName"
                :search-input="searchInput"
              />
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              /<HighlightedSearchTerms
                :text="channel.uniqueName"
                :search-input="searchInput"
              />
            </p>
          </nuxt-link>
        </div>

        <!-- Description -->
        <p
          v-if="channel.description"
          class="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300"
        >
          <HighlightedSearchTerms
            :text="channel.description"
            :search-input="searchInput"
          />
        </p>

        <!-- Tags -->
        <div v-if="tags.length > 0" class="mb-3 flex flex-wrap gap-1">
          <Tag
            v-for="tag in tags.slice(0, 5)"
            :key="tag"
            :active="selectedTags.includes(tag)"
            :tag="tag"
            @click="$emit('filterByTag', tag)"
          />
          <span
            v-if="tags.length > 5"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            +{{ tags.length - 5 }} more
          </span>
        </div>
      </div>

      <!-- Stats sidebar -->
      <div
        class="hidden flex-col items-end gap-2 text-sm text-gray-500 dark:text-gray-400 sm:flex"
      >
        <nuxt-link
          :to="`/forums/${channel.uniqueName}/discussions`"
          class="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <DiscussionIcon class="h-4 w-4" />
          <span class="font-medium">{{
            channel?.DiscussionChannelsAggregate?.count || 0
          }}</span>
          <span class="hidden md:inline">Discussions</span>
        </nuxt-link>

        <nuxt-link
          v-if="downloadCount > 0"
          :to="`/forums/${channel.uniqueName}/downloads`"
          class="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <DownloadIcon class="h-4 w-4" />
          <span class="font-medium">{{ downloadCount }}</span>
          <span class="hidden md:inline">Downloads</span>
        </nuxt-link>

        <nuxt-link
          v-if="channel?.EventChannelsAggregate?.count"
          :to="`/forums/${channel.uniqueName}/events`"
          class="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <CalendarIcon class="h-4 w-4" />
          <span class="font-medium">{{
            channel?.EventChannelsAggregate?.count || 0
          }}</span>
          <span class="hidden md:inline">Events</span>
        </nuxt-link>
      </div>
    </div>

    <!-- Mobile stats (shown below main content on mobile) -->
    <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm sm:hidden">
      <nuxt-link
        :to="`/forums/${channel.uniqueName}/discussions`"
        class="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <DiscussionIcon class="h-4 w-4" />
        {{ channel?.DiscussionChannelsAggregate?.count || 0 }} Discussions
      </nuxt-link>
      <nuxt-link
        v-if="downloadCount > 0"
        :to="`/forums/${channel.uniqueName}/downloads`"
        class="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <DownloadIcon class="h-4 w-4" />
        {{ downloadCount }} Downloads
      </nuxt-link>
      <nuxt-link
        v-if="channel?.EventChannelsAggregate?.count"
        :to="`/forums/${channel.uniqueName}/events`"
        class="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <CalendarIcon class="h-4 w-4" />
        {{ channel?.EventChannelsAggregate?.count || 0 }} Events
      </nuxt-link>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
