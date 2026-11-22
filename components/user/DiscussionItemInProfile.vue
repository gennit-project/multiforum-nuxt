<script setup lang="ts">
import { computed } from 'vue';
import { relativeTime } from '@/utils';
import Tag from '@/components/TagComponent.vue';
import TagOverflowLabel from '@/components/TagOverflowLabel.vue';
import { splitTagsForList } from '@/utils/tagOverflow';
import HighlightedSearchTerms from '@/components/HighlightedSearchTerms.vue';
import {
  getDiscussionRoute,
  getDiscussionUrl,
  getDownloadRoute,
  getDownloadUrl,
} from '@/utils/contentUrls';
import type { GetUserDiscussionsQuery } from '@/__generated__/operations';
import type { NullableSelection } from '@/types/Comment';
import type { UserContributionActivity } from '@/types/contribution';
type Discussion = NullableSelection<GetUserDiscussionsQuery['users'][number]['Discussions'][number] | UserContributionActivity['Discussions'][number]>;

const props = defineProps({
  discussion: {
    type: Object as () => Discussion,
    required: true,
  },
  searchInput: {
    type: String,
    default: '',
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

const defaultUniqueName = computed(() => {
  if (
    !props.discussion.DiscussionChannels ||
    !props.discussion.DiscussionChannels[0]
  ) {
    return '';
  }
  const channel = props.discussion.DiscussionChannels[0];
  return channel.channelUniqueName || '';
});

const isDownload = computed(() => 'hasDownload' in props.discussion && !!props.discussion.hasDownload);

// Primary link target for the card title, so it is reachable by keyboard
// instead of relying on a click handler on the whole <li>.
type ProfileDiscussionChannel = NonNullable<
  Discussion['DiscussionChannels']
>[number];

const linkTargetFor = (channel: ProfileDiscussionChannel) => ({
  forumId: channel?.channelUniqueName || '',
  discussionNumber:
    channel && 'discussionNumber' in channel ? channel.discussionNumber : null,
  title: props.discussion.title,
  discussionId: props.discussion.id,
});

const titleLink = computed(() => {
  if (!defaultUniqueName.value || !props.discussion.id) return '';
  const firstChannel = props.discussion.DiscussionChannels?.[0];
  if (!firstChannel) return '';
  const target = linkTargetFor(firstChannel);
  return isDownload.value ? getDownloadUrl(target) : getDiscussionUrl(target);
});

const channelLink = (channel: ProfileDiscussionChannel) => {
  const target = linkTargetFor(channel);
  return isDownload.value ? getDownloadRoute(target) : getDiscussionRoute(target);
};

const title = computed(() => props.discussion.title || '');
const relativeTimeText = relativeTime(props.discussion.createdAt || '');
const authorUsername = props.discussion.Author
  ? props.discussion.Author.username
  : 'Deleted';
const tags = computed(() => ('Tags' in props.discussion ? props.discussion.Tags ?? [] : []).map((tag) => tag.text));
const tagOverflow = computed(() => splitTagsForList(tags.value));
const channels = computed(() => (props.discussion.DiscussionChannels || []).filter((item) => item !== null));
const channelName = (channel: (typeof channels.value)[number]) => channel.channelUniqueName || '';
</script>

<template>
  <li
    class="relative list-none rounded-lg bg-gray-100 p-4 dark:bg-gray-800 dark:text-white"
  >
    <nuxt-link
      v-if="titleLink"
      :to="titleLink"
      class="focus-visible:ring-brand-500 font-medium hover:underline focus:outline-none focus-visible:ring-2"
    >
      <HighlightedSearchTerms :text="title" :search-input="searchInput" />
    </nuxt-link>
    <HighlightedSearchTerms v-else :text="title" :search-input="searchInput" />

    <p
      class="mt-1 flex space-x-1 text-sm font-medium text-gray-600 hover:no-underline"
    >
      <Tag
        v-for="tag in tagOverflow.visible"
        :key="tag"
        class="my-1"
        :active="selectedTags.includes(tag)"
        :tag="tag"
      />
      <TagOverflowLabel :count="tagOverflow.hiddenCount" />
    </p>
    <p
      class="text-xs font-medium text-gray-600 no-underline dark:text-gray-300"
    >
      {{ `Posted ${relativeTimeText} by ${authorUsername}` }}
    </p>
    <div class="my-2 space-x-2 text-sm">
      <nuxt-link
        v-for="(discussionChannel, i) in channels"
        :key="i"
        class="text-gray-500 underline hover:text-gray-700 dark:text-gray-300 hover:dark:text-gray-200"
        :to="channelLink(discussionChannel)"
      >
        View this {{ isDownload ? 'download' : 'post' }} in
        {{
          `c/${channelName(discussionChannel)}`
        }}
      </nuxt-link>
    </div>
  </li>
</template>

<style>
.highlighted {
  background-color: #f9f95d;
}
</style>
