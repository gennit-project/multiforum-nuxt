<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';
import TagComponent from '@/components/TagComponent.vue';
import AddToDiscussionFavorites from '@/components/favorites/AddToDiscussionFavorites.vue';
import CommentIcon from '@/components/icons/CommentIcon.vue';
import type { Album } from '@/__generated__/graphql';
import { relativeTime } from '@/utils';

type AuthorInfo = {
  username: string;
  displayName: string;
  profilePicURL: string;
  commentKarma: number;
  discussionKarma: number;
  createdAt: string;
  isAdmin: boolean;
};

type DiscussionItem = {
  id: string;
  title: string;
  body?: string | null;
  createdAt: string;
  hasSensitiveContent?: boolean | null;
  Tags?: Array<{ text?: string | null }> | null;
  Album?: {
    Images?: Array<unknown> | null;
  } | null;
};

const props = withDefaults(
  defineProps<{
    discussion: DiscussionItem;
    discussionLink: string;
    channelLink?: string;
    channelUniqueName?: string;
    authorInfo?: AuthorInfo | null;
    commentCount?: number;
    forumCount?: number;
    showFavoriteButton?: boolean;
    allowAddToList?: boolean;
    isFavorited?: boolean;
    favoriteEntityName?: string;
  }>(),
  {
    channelLink: '/',
    channelUniqueName: '',
    authorInfo: null,
    commentCount: 0,
    forumCount: 1,
    showFavoriteButton: true,
    allowAddToList: false,
    isFavorited: false,
    favoriteEntityName: 'Discussion',
  }
);

const DiscussionAlbum = defineAsyncComponent(
  () => import('@/components/discussion/detail/DiscussionAlbum.vue')
);

const visibleTags = computed(() =>
  (props.discussion.Tags || []).filter((tag) => !!tag?.text).slice(0, 5)
);

const albumForDisplay = computed(() => props.discussion.Album as Album | null);
</script>

<template>
  <article
    class="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)] dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="border-b border-slate-200/70 bg-slate-50/85 px-5 py-3 dark:border-gray-700 dark:bg-gray-900/40">
      <div class="flex items-center justify-between gap-3">
        <NuxtLink
          v-if="channelUniqueName"
          :to="channelLink"
          class="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-orange-600 transition-colors hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
        >
          <AvatarComponent
            :text="channelUniqueName"
            :is-square="true"
            class="h-5 w-5 flex-shrink-0"
          />
          <span class="truncate">{{ channelUniqueName }}</span>
        </NuxtLink>

        <div class="ml-auto flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span
            v-if="discussion.hasSensitiveContent"
            class="rounded-full border border-orange-300 bg-orange-50 px-2 py-1 font-medium text-orange-700 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-300"
          >
            Sensitive
          </span>
          <span>{{ relativeTime(discussion.createdAt) }}</span>
        </div>
      </div>
    </div>

    <div class="space-y-4 p-5">
      <div class="flex items-start gap-3">
        <NuxtLink
          :to="discussionLink"
          class="min-w-0 flex-1 text-lg font-semibold leading-7 text-gray-900 transition-colors hover:text-orange-600 dark:text-white dark:hover:text-orange-400"
        >
          {{ discussion.title }}
        </NuxtLink>

        <div v-if="showFavoriteButton" class="flex-shrink-0">
          <AddToDiscussionFavorites
            :allow-add-to-list="allowAddToList"
            :discussion-id="discussion.id"
            :discussion-title="discussion.title"
            :initial-is-favorited="isFavorited"
            :entity-name="favoriteEntityName"
            size="medium"
          />
        </div>
      </div>

      <div
        v-if="discussion.body"
        class="rounded-xl bg-slate-50/80 px-4 py-3 text-sm text-gray-700 dark:bg-gray-900/45 dark:text-gray-300"
      >
        <div class="line-clamp-3">
          <MarkdownRenderer :text="discussion.body" font-size="small" />
        </div>
      </div>

      <div
        v-if="discussion.Album?.Images?.length"
        class="overflow-hidden rounded-xl border border-slate-200 bg-black dark:border-gray-700"
      >
        <DiscussionAlbum
          :album="albumForDisplay"
          :discussion-id="discussion.id"
          :discussion-author="authorInfo?.username || 'Deleted'"
          :carousel-format="true"
          :show-edit-album="false"
        />
      </div>

      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
        <div class="flex min-w-0 items-center">
          <span class="mr-1">by</span>
          <UsernameWithTooltip
            v-if="authorInfo"
            :username="authorInfo.username"
            :display-name="authorInfo.displayName"
            :src="authorInfo.profilePicURL"
            :is-server-admin="authorInfo.isAdmin"
            :comment-karma="authorInfo.commentKarma"
            :discussion-karma="authorInfo.discussionKarma"
            :account-created="authorInfo.createdAt"
          />
          <span v-else>Deleted</span>
        </div>

        <NuxtLink
          :to="discussionLink"
          class="inline-flex items-center gap-1 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
        >
          <CommentIcon class="h-4 w-4" />
          {{ commentCount }} {{ commentCount === 1 ? 'comment' : 'comments' }}
        </NuxtLink>

        <span v-if="forumCount > 1" class="text-xs">
          in {{ forumCount }} forums
        </span>
      </div>

      <div
        v-if="visibleTags.length > 0"
        class="flex flex-wrap gap-2 border-t border-slate-200/80 pt-4 dark:border-gray-700"
      >
        <TagComponent
          v-for="(tag, index) in visibleTags"
          :key="tag.text || `discussion-tag-${index}`"
          :tag="tag.text || ''"
          class="text-xs"
          @click.prevent=""
        />
      </div>
    </div>
  </article>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
