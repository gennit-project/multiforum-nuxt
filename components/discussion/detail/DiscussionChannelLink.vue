<script setup lang="ts">
import { computed } from 'vue';
import { getDiscussionRoute } from '@/utils/contentUrls';

interface Props {
  channelDisplayName?: string;
  channelIcon?: string;
  discussionId: string;
  /** Per-forum number of the discussion in `channelId`. */
  discussionNumber?: number | null;
  /** Discussion title, for the decorative slug in the link. */
  discussionTitle?: string | null;
  channelId: string;
  commentCount: number;
  upvoteCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  channelDisplayName: '',
  channelIcon: '',
  discussionNumber: null,
  discussionTitle: null,
  upvoteCount: 0,
});

const discussionLink = computed(() =>
  getDiscussionRoute({
    forumId: props.channelId,
    discussionNumber: props.discussionNumber,
    title: props.discussionTitle,
    discussionId: props.discussionId,
  })
);
</script>
<template>
  <li>
    <div class="flex flex-wrap items-center gap-1">
      <nuxt-link
        :data-testid="`comments-in-${channelId}`"
        class="underline"
        :to="discussionLink"
      >
        {{ `${commentCount} comments` }}
      </nuxt-link>
      <span
        >and {{ upvoteCount || 0 }}
        {{ upvoteCount === 1 ? 'upvote' : 'upvotes' }} in</span
      >
      <nuxt-link
        :to="discussionLink"
      >
        <div
          class="inline-flex items-center gap-2 rounded-md bg-gray-100 px-2 py-1 dark:bg-gray-700"
        >
          <AvatarComponent
            class="shadow-sm dark:border-gray-800"
            :text="channelId"
            :src="channelIcon ?? ''"
            :is-small="true"
            :is-square="false"
            :is-decorative="true"
          />
          <div class="flex flex-col text-xs">
            <div v-if="channelDisplayName" class="font-bold">
              {{ channelDisplayName }}
            </div>
            <div
              :class="[
                channelDisplayName ? 'font-mono' : 'font-mono font-bold',
              ]"
            >
              {{ channelId }}
            </div>
          </div>
        </div>
      </nuxt-link>
    </div>
  </li>
</template>
