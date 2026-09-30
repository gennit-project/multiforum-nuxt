<script setup lang="ts">
import { computed } from 'vue';
import { timeAgo } from '@/utils';
import type { LibraryFavoriteItem, LibraryFavoriteKind } from '@/types/library';
import LibraryFavoriteRowActions from './LibraryFavoriteRowActions.vue';

const props = defineProps<{
  item: LibraryFavoriteItem;
}>();

const emit = defineEmits<{
  removed: [itemId: string];
}>();

const kindLabels: Record<LibraryFavoriteKind, string> = {
  discussion: 'Discussion',
  download: 'Download',
  image: 'Image',
  comment: 'Comment',
  channel: 'Forum',
};

const badgeClasses: Record<LibraryFavoriteKind, string> = {
  discussion:
    'border-amber-300/70 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-300',
  download:
    'border-green-300/70 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/35 dark:text-green-300',
  image:
    'border-brand-300/70 bg-brand-50 text-brand-800 dark:border-brand-800 dark:bg-brand-950/35 dark:text-brand-300',
  comment:
    'border-purple-300/70 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950/35 dark:text-purple-300',
  channel:
    'border-blue-300/70 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/35 dark:text-blue-300',
};

const kindLabel = computed(() => kindLabels[props.item.kind]);
const publishedLabel = computed(() => {
  if (!props.item.createdAt) return '';
  return timeAgo(new Date(props.item.createdAt));
});
</script>

<template>
  <article
    class="grid grid-cols-[3.5rem_minmax(0,1fr)_2.75rem] items-start gap-3 border-b border-gray-200 px-3 py-3 last:border-b-0 sm:grid-cols-[3.5rem_minmax(0,1.25fr)_8rem_13rem_5.5rem_2.75rem] sm:items-center sm:px-4 dark:border-gray-800"
    :data-testid="`library-favorite-${item.kind}-${item.id}`"
  >
    <NuxtLink
      :to="item.href"
      class="focus:ring-brand-500/30 flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-500 focus:ring-2 focus:outline-none dark:bg-gray-800 dark:text-gray-300"
      :aria-label="`Open ${item.title}`"
    >
      <img
        v-if="item.thumbnailUrl"
        :src="item.thumbnailUrl"
        :alt="''"
        class="h-full w-full object-cover"
      />
      <span v-else class="text-lg font-semibold" aria-hidden="true">
        {{ kindLabel.charAt(0) }}
      </span>
    </NuxtLink>

    <div class="min-w-0">
      <NuxtLink
        :to="item.href"
        class="hover:text-brand-700 focus:ring-brand-500/30 dark:hover:text-brand-300 line-clamp-1 rounded-sm font-semibold text-gray-950 focus:ring-2 focus:outline-none dark:text-white"
      >
        {{ item.title }}
      </NuxtLink>
      <p class="mt-0.5 line-clamp-1 text-sm text-gray-500 dark:text-gray-400">
        {{ item.summary }}
      </p>

      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 sm:hidden">
        <span
          class="rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] uppercase"
          :class="badgeClasses[item.kind]"
        >
          {{ kindLabel }}
        </span>
        <NuxtLink
          v-if="item.source.forumUniqueName"
          :to="`/forums/${item.source.forumUniqueName}`"
          class="text-brand-700 hover:text-brand-800 focus:ring-brand-500/30 dark:text-brand-300 rounded-sm text-xs font-medium underline decoration-current/50 underline-offset-2 focus:ring-2 focus:outline-none"
        >
          {{ item.source.forumName }}
        </NuxtLink>
        <NuxtLink
          v-if="item.source.uploaderUsername"
          :to="`/u/${item.source.uploaderUsername}`"
          class="text-brand-700 hover:text-brand-800 focus:ring-brand-500/30 dark:text-brand-300 rounded-sm text-xs font-medium underline decoration-current/50 underline-offset-2 focus:ring-2 focus:outline-none"
        >
          @{{ item.source.uploaderUsername }}
        </NuxtLink>
      </div>
    </div>

    <div class="hidden sm:block">
      <span
        class="inline-flex rounded-md border px-2 py-1 text-[10px] font-bold tracking-[0.08em] uppercase"
        :class="badgeClasses[item.kind]"
      >
        {{ kindLabel }}
      </span>
    </div>

    <div class="hidden min-w-0 text-xs sm:block">
      <p v-if="item.source.forumUniqueName" class="truncate text-gray-500">
        Forum:
        <NuxtLink
          :to="`/forums/${item.source.forumUniqueName}`"
          class="text-brand-700 hover:text-brand-800 focus:ring-brand-500/30 dark:text-brand-300 rounded-sm font-medium underline decoration-current/50 underline-offset-2 focus:ring-2 focus:outline-none"
        >
          {{ item.source.forumName }}
        </NuxtLink>
      </p>
      <p
        v-if="item.source.uploaderUsername"
        class="mt-1 truncate text-gray-500"
      >
        Uploader:
        <NuxtLink
          :to="`/u/${item.source.uploaderUsername}`"
          class="text-brand-700 hover:text-brand-800 focus:ring-brand-500/30 dark:text-brand-300 rounded-sm font-medium underline decoration-current/50 underline-offset-2 focus:ring-2 focus:outline-none"
        >
          @{{ item.source.uploaderUsername }}
        </NuxtLink>
      </p>
    </div>

    <time
      v-if="publishedLabel"
      :datetime="item.createdAt || undefined"
      class="hidden text-xs text-gray-500 sm:block dark:text-gray-400"
    >
      {{ publishedLabel }}
    </time>

    <LibraryFavoriteRowActions
      :item-id="item.id"
      :item-kind="item.kind"
      :item-title="item.title"
      @removed="emit('removed', $event)"
    />
  </article>
</template>
