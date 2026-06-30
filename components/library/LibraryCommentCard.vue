<script setup lang="ts">
import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';
import AddToCommentFavorites from '@/components/favorites/AddToCommentFavorites.vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import { relativeTime } from '@/utils';

type AuthorInfo = {
  username: string;
  displayName: string;
  profilePicURL: string;
  commentKarma: number;
  discussionKarma: number;
  createdAt: string;
  isAdmin: boolean;
  isModerationProfile?: boolean;
};

type CommentItem = {
  id: string;
  text: string;
  createdAt: string;
};

withDefaults(
  defineProps<{
    comment: CommentItem;
    authorInfo?: AuthorInfo | null;
    contextType: string;
    contextTitle: string;
    contextPermalink: Record<string, unknown> | string;
    permalink: Record<string, unknown> | string;
    showFavoriteButton?: boolean;
    allowAddToList?: boolean;
    isFavorited?: boolean;
  }>(),
  {
    authorInfo: null,
    showFavoriteButton: false,
    allowAddToList: false,
    isFavorited: true,
  }
);
</script>

<template>
  <article
    class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)] dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="mb-4 flex items-start justify-between gap-3">
      <NuxtLink
        :to="contextPermalink"
        class="inline-flex min-w-0 items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:hover:bg-orange-500/20"
      >
        <span class="opacity-80">{{ contextType }}</span>
        <span class="truncate">{{ contextTitle }}</span>
      </NuxtLink>
      <span class="flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">
        {{ relativeTime(comment.createdAt) }}
      </span>
    </div>

    <div class="rounded-xl bg-slate-50/80 px-4 py-3 dark:bg-gray-900/45">
      <div class="prose prose-sm max-w-none dark:prose-invert">
        <MarkdownPreview :text="comment.text" :disable-gallery="false" />
      </div>
    </div>

    <div class="mt-4 flex items-center justify-between gap-3">
      <div class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
        <div class="flex min-w-0 items-center">
          <span class="mr-1">by</span>
          <UsernameWithTooltip
            v-if="authorInfo && !authorInfo.isModerationProfile"
            :username="authorInfo.username"
            :display-name="authorInfo.displayName"
            :src="authorInfo.profilePicURL"
            :is-server-admin="authorInfo.isAdmin"
            :comment-karma="authorInfo.commentKarma"
            :discussion-karma="authorInfo.discussionKarma"
            :account-created="authorInfo.createdAt"
          />
          <span
            v-else-if="authorInfo?.isModerationProfile"
            class="text-orange-600 dark:text-orange-400"
          >
            {{ authorInfo.displayName }} (Moderator)
          </span>
          <span v-else>Deleted</span>
        </div>

        <NuxtLink
          :to="permalink"
          class="inline-flex items-center gap-1 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
        >
          <i class="fa-regular fa-comment" />
          View Comment
        </NuxtLink>
      </div>

      <div v-if="showFavoriteButton" class="flex-shrink-0">
        <AddToCommentFavorites
          :allow-add-to-list="allowAddToList"
          :comment-id="comment.id"
          :is-favorited="isFavorited"
          size="medium"
        />
      </div>
    </div>
  </article>
</template>
