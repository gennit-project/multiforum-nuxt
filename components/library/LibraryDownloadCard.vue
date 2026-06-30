<script setup lang="ts">
import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';
import TagComponent from '@/components/TagComponent.vue';
import AddToDiscussionFavorites from '@/components/favorites/AddToDiscussionFavorites.vue';
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

type DownloadItem = {
  id: string;
  title: string;
  createdAt: string;
  Tags?: Array<{ text?: string | null }> | null;
};

const props = withDefaults(
  defineProps<{
    download: DownloadItem;
    downloadLink: string;
    channelLink?: string;
    channelUniqueName?: string;
    authorInfo?: AuthorInfo | null;
    previewImageUrl?: string;
    showFavoriteButton?: boolean;
    allowAddToList?: boolean;
    isFavorited?: boolean;
  }>(),
  {
    channelLink: '/',
    channelUniqueName: '',
    authorInfo: null,
    previewImageUrl: '',
    showFavoriteButton: true,
    allowAddToList: false,
    isFavorited: false,
  }
);
</script>

<template>
  <article
    class="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)] dark:border-gray-700 dark:bg-gray-800"
  >
    <NuxtLink
      :to="downloadLink"
      class="relative block aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-gray-700"
    >
      <img
        v-if="previewImageUrl"
        :src="previewImageUrl"
        :alt="download.title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      >
      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 via-white to-slate-100 text-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700"
      >
        <svg
          class="h-12 w-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-4">
        <div class="flex items-center justify-between gap-2 text-xs text-white/90">
          <div
            v-if="channelUniqueName"
            class="inline-flex min-w-0 items-center gap-2 font-medium text-white"
          >
            <AvatarComponent
              :text="channelUniqueName"
              :is-square="true"
              class="h-4 w-4 flex-shrink-0"
            />
            <span class="truncate">{{ channelUniqueName }}</span>
          </div>
          <span class="ml-auto">{{ relativeTime(download.createdAt) }}</span>
        </div>
      </div>
    </NuxtLink>

    <div class="space-y-3 p-4">
      <div class="flex items-start gap-3">
        <NuxtLink
          :to="downloadLink"
          class="min-w-0 flex-1 text-base font-semibold leading-6 text-gray-900 transition-colors hover:text-orange-600 dark:text-white dark:hover:text-orange-400"
        >
          {{ download.title }}
        </NuxtLink>

        <div v-if="showFavoriteButton" class="flex-shrink-0">
          <AddToDiscussionFavorites
            :allow-add-to-list="allowAddToList"
            :discussion-id="download.id"
            :discussion-title="download.title"
            :initial-is-favorited="isFavorited"
            entity-name="Download"
            size="small"
          />
        </div>
      </div>

      <div class="flex min-w-0 items-center text-xs text-gray-500 dark:text-gray-400">
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

      <div
        v-if="download.Tags?.length"
        class="flex flex-wrap gap-2 border-t border-slate-200/80 pt-3 dark:border-gray-700"
      >
        <TagComponent
          v-for="(tag, index) in download.Tags.slice(0, 4)"
          :key="tag.text || `download-tag-${index}`"
          :tag="tag.text || ''"
          class="text-xs"
          @click.prevent=""
        />
      </div>
    </div>
  </article>
</template>
