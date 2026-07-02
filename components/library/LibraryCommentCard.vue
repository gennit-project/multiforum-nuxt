<script setup lang="ts">
import AvatarComponent from '@/components/AvatarComponent.vue';
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
    class="rounded-[1.6rem] border border-gray-200/80 bg-white/92 p-5 shadow-[0_18px_45px_-28px_rgba(38,38,38,0.24)] dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="mb-4 flex items-start justify-between gap-4">
      <div class="flex min-w-0 items-center gap-3">
        <AvatarComponent
          :text="authorInfo?.displayName || authorInfo?.username || 'Deleted'"
          :src="authorInfo?.profilePicURL || ''"
          :is-small="true"
        />
        <div class="min-w-0">
          <div class="min-w-0 text-sm text-gray-900 dark:text-white">
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
              class="font-semibold text-orange-600 dark:text-orange-400"
            >
              {{ authorInfo.displayName }} (Moderator)
            </span>
            <span v-else class="font-semibold">Deleted</span>
          </div>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ relativeTime(comment.createdAt) }}
          </p>
        </div>
      </div>

      <NuxtLink
        :to="permalink"
        aria-label="Open comment"
        class="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
      >
        <i class="fa-solid fa-ellipsis" />
      </NuxtLink>
    </div>

    <div class="rounded-[1.2rem] border border-gray-200/80 bg-gray-50/85 px-4 py-4 dark:border-gray-700 dark:bg-gray-900">
      <div class="prose prose-sm max-w-none leading-[1.6] dark:prose-invert">
        <MarkdownPreview :text="comment.text" :disable-gallery="false" />
      </div>
    </div>

    <div class="mt-5 flex items-end justify-between gap-4">
      <div class="min-w-0 text-sm text-gray-500 dark:text-gray-400">
        <NuxtLink
          :to="contextPermalink"
          class="inline-flex min-w-0 items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 font-medium text-orange-700 transition-colors hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:hover:bg-orange-500/20"
        >
          <span class="opacity-75">Post from</span>
          <span class="truncate">{{ contextTitle }}</span>
        </NuxtLink>
      </div>

      <div class="flex flex-shrink-0 items-center gap-2">
        <NuxtLink
          :to="permalink"
          class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
          aria-label="View comment thread"
        >
          <i class="fa-solid fa-arrow-up-right-from-square text-sm" />
        </NuxtLink>
        <div v-if="showFavoriteButton" class="flex-shrink-0">
          <AddToCommentFavorites
            :allow-add-to-list="allowAddToList"
            :comment-id="comment.id"
            :is-favorited="isFavorited"
            size="medium"
          />
        </div>
      </div>
    </div>
  </article>
</template>
