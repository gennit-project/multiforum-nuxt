<script setup lang="ts">
import { computed, ref } from 'vue';
import { useHead } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import removeMarkdown from 'remove-markdown';
import type {
  Album,
  Channel,
  Comment,
  Discussion,
  DiscussionChannel,
  Image,
  User,
} from '@/__generated__/graphql';
import { useUsername } from '@/composables/useAuthState';
import { GET_UNIFIED_LIBRARY_FAVORITES } from '@/graphQLData/library/queries';
import { getCommentPermalink } from '@/utils/commentUtils';
import {
  getDiscussionLink,
  getDownloadLink,
} from '@/utils/favoriteDiscussionDisplay';
import ErrorBanner from '@/components/ErrorBanner.vue';
import BookmarkIcon from '@/components/icons/BookmarkIcon.vue';
import LibraryFavoriteRow from '@/components/library/LibraryFavoriteRow.vue';
import type {
  LibraryFavoriteItem,
  LibraryFavoriteKind,
  LibraryFavoriteSource,
} from '@/types/library';

type UserSummary = Pick<User, 'username' | 'displayName' | 'profilePicURL'>;
type ChannelSummary = Pick<
  Channel,
  'uniqueName' | 'displayName' | 'channelIconURL'
>;
type DiscussionChannelSummary = Pick<DiscussionChannel, 'channelUniqueName'> & {
  Channel?: ChannelSummary | null;
};
type AlbumImageSummary = Pick<Image, 'id' | 'url'>;
type FavoriteDiscussion = Pick<
  Discussion,
  'id' | 'title' | 'body' | 'createdAt' | 'hasDownload'
> & {
  Author?: UserSummary | null;
  DiscussionChannels?: DiscussionChannelSummary[] | null;
  Album?:
    | (Pick<Album, 'id' | 'imageOrder'> & {
        Images?: AlbumImageSummary[] | null;
      })
    | null;
};
type FavoriteImage = Pick<
  Image,
  'id' | 'url' | 'alt' | 'caption' | 'createdAt'
> & {
  Uploader?: UserSummary | null;
  Albums?: Array<{
    id: string;
    Discussions?: Array<{
      DiscussionChannels?: DiscussionChannelSummary[] | null;
    }> | null;
  }> | null;
};
type FavoriteComment = Pick<Comment, 'id' | 'text' | 'createdAt'> & {
  CommentAuthor?:
    | ({ __typename?: 'User' } & UserSummary)
    | { __typename?: 'ModerationProfile'; displayName?: string | null }
    | null;
  DiscussionChannel?:
    | (Pick<DiscussionChannel, 'discussionId' | 'channelUniqueName'> & {
        Channel?: ChannelSummary | null;
        Discussion?: Pick<Discussion, 'title' | 'hasDownload'> | null;
      })
    | null;
  Channel?: ChannelSummary | null;
};
type FavoriteChannel = Pick<
  Channel,
  'uniqueName' | 'displayName' | 'description' | 'channelIconURL' | 'createdAt'
> & {
  Admins?: UserSummary[] | null;
};
type UnifiedFavoritesResult = {
  users?: Array<{
    FavoriteDiscussions?: FavoriteDiscussion[] | null;
    FavoriteImages?: FavoriteImage[] | null;
    FavoriteComments?: FavoriteComment[] | null;
    FavoriteChannels?: FavoriteChannel[] | null;
  }> | null;
};

type FilterOption = {
  key: 'all' | LibraryFavoriteKind;
  label: string;
};

useHead({ title: 'Library' });

const username = useUsername();
const activeFilter = ref<FilterOption['key']>('all');
const searchTerm = ref('');
const removedItemKeys = ref(new Set<string>());

const filterOptions: FilterOption[] = [
  { key: 'all', label: 'All' },
  { key: 'discussion', label: 'Discussions' },
  { key: 'image', label: 'Images' },
  { key: 'comment', label: 'Comments' },
  { key: 'download', label: 'Downloads' },
  { key: 'channel', label: 'Forums' },
];

const { result, loading, error } = useQuery<UnifiedFavoritesResult>(
  GET_UNIFIED_LIBRARY_FAVORITES,
  () => ({ username: username.value }),
  () => ({
    enabled: Boolean(username.value),
    fetchPolicy: 'cache-and-network',
  })
);

const cleanText = (value?: string | null) =>
  removeMarkdown(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const getSource = (params: {
  forum?: ChannelSummary | null;
  forumFallback?: string | null;
  uploader?: UserSummary | null;
}): LibraryFavoriteSource => ({
  forumName:
    params.forum?.displayName ||
    params.forum?.uniqueName ||
    params.forumFallback ||
    '',
  forumUniqueName: params.forum?.uniqueName || params.forumFallback || '',
  uploaderName: params.uploader?.displayName || params.uploader?.username || '',
  uploaderUsername: params.uploader?.username || '',
});

const getDiscussionThumbnail = (discussion: FavoriteDiscussion) => {
  const images = discussion.Album?.Images || [];
  const firstId = discussion.Album?.imageOrder?.find(Boolean);
  if (!firstId) return images[0]?.url || null;
  return (
    images.find((image) => image.id === firstId)?.url || images[0]?.url || null
  );
};

const discussionItems = computed<LibraryFavoriteItem[]>(() =>
  (result.value?.users?.[0]?.FavoriteDiscussions || []).map((discussion) => {
    const firstContext = discussion.DiscussionChannels?.[0];
    const kind: LibraryFavoriteKind = discussion.hasDownload
      ? 'download'
      : 'discussion';

    return {
      id: discussion.id,
      kind,
      title: discussion.title,
      summary: cleanText(discussion.body) || 'No description provided.',
      href: discussion.hasDownload
        ? getDownloadLink({
            id: discussion.id,
            DiscussionChannels: discussion.DiscussionChannels || [],
          })
        : getDiscussionLink({
            id: discussion.id,
            DiscussionChannels: discussion.DiscussionChannels || [],
          }),
      thumbnailUrl: getDiscussionThumbnail(discussion),
      createdAt: discussion.createdAt,
      source: getSource({
        forum: firstContext?.Channel,
        forumFallback: firstContext?.channelUniqueName,
        uploader: discussion.Author,
      }),
    };
  })
);

const imageItems = computed<LibraryFavoriteItem[]>(() =>
  (result.value?.users?.[0]?.FavoriteImages || []).map((image) => {
    const firstContext =
      image.Albums?.[0]?.Discussions?.[0]?.DiscussionChannels?.[0];
    return {
      id: image.id,
      kind: 'image',
      title: image.caption || image.alt || 'Untitled image',
      summary: image.alt || image.caption || 'Saved image',
      href: image.Uploader?.username
        ? `/u/${image.Uploader.username}/images/${image.id}`
        : '/library/favorite-images',
      thumbnailUrl: image.url,
      createdAt: image.createdAt,
      source: getSource({
        forum: firstContext?.Channel,
        forumFallback: firstContext?.channelUniqueName,
        uploader: image.Uploader,
      }),
    };
  })
);

const commentItems = computed<LibraryFavoriteItem[]>(() =>
  (result.value?.users?.[0]?.FavoriteComments || []).map((comment) => {
    const forum = comment.DiscussionChannel?.Channel || comment.Channel;
    const uploader =
      comment.CommentAuthor?.__typename === 'User'
        ? comment.CommentAuthor
        : null;
    const contextTitle =
      comment.DiscussionChannel?.Discussion?.title ||
      forum?.displayName ||
      forum?.uniqueName ||
      'Saved comment';

    return {
      id: comment.id,
      kind: 'comment',
      title: `Comment in ${contextTitle}`,
      summary: cleanText(comment.text) || 'Saved comment',
      href: getCommentPermalink({
        id: comment.id,
        DiscussionChannel: comment.DiscussionChannel
          ? {
              channelUniqueName:
                comment.DiscussionChannel.channelUniqueName || undefined,
              discussionId: comment.DiscussionChannel.discussionId || undefined,
              Discussion: comment.DiscussionChannel.Discussion || undefined,
            }
          : undefined,
        Channel: comment.Channel || undefined,
      }),
      createdAt: comment.createdAt,
      source: getSource({
        forum,
        forumFallback: comment.DiscussionChannel?.channelUniqueName,
        uploader,
      }),
    };
  })
);

const channelItems = computed<LibraryFavoriteItem[]>(() =>
  (result.value?.users?.[0]?.FavoriteChannels || []).map((channel) => ({
    id: channel.uniqueName,
    kind: 'channel',
    title: channel.displayName || channel.uniqueName,
    summary: cleanText(channel.description) || 'Saved forum',
    href: `/forums/${channel.uniqueName}`,
    thumbnailUrl: channel.channelIconURL,
    createdAt: channel.createdAt,
    source: getSource({ forum: channel, uploader: channel.Admins?.[0] }),
  }))
);

const allItems = computed(() =>
  [
    ...discussionItems.value,
    ...imageItems.value,
    ...commentItems.value,
    ...channelItems.value,
  ]
    .filter((item) => !removedItemKeys.value.has(`${item.kind}:${item.id}`))
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt
        ? new Date(right.createdAt).getTime()
        : 0;
      return rightTime - leftTime;
    })
);

const filteredItems = computed(() => {
  const normalizedSearch = searchTerm.value.trim().toLowerCase();
  return allItems.value.filter((item) => {
    if (activeFilter.value !== 'all' && item.kind !== activeFilter.value) {
      return false;
    }
    if (!normalizedSearch) return true;
    return [
      item.title,
      item.summary,
      item.source.forumName,
      item.source.uploaderName,
      item.source.uploaderUsername,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
  });
});

const coverImages = computed(() =>
  allItems.value
    .map((item) => item.thumbnailUrl)
    .filter((url): url is string => Boolean(url))
    .slice(0, 4)
);

const handleRemoved = (item: LibraryFavoriteItem) => {
  removedItemKeys.value = new Set(removedItemKeys.value).add(
    `${item.kind}:${item.id}`
  );
};
</script>

<template>
  <section class="min-h-[36rem] px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
    <div
      class="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"
    >
      <div class="flex min-w-0 items-center gap-4">
        <div
          class="grid h-24 w-24 shrink-0 grid-cols-2 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          aria-hidden="true"
        >
          <template v-if="coverImages.length">
            <img
              v-for="(url, index) in coverImages"
              :key="`${url}-${index}`"
              :src="url"
              alt=""
              class="h-full min-h-0 w-full object-cover"
            />
          </template>
          <BookmarkIcon
            v-else
            class="text-brand-500 col-span-2 m-auto h-10 w-10"
          />
        </div>
        <div class="min-w-0">
          <p
            class="text-[11px] font-semibold tracking-[0.22em] text-gray-500 uppercase dark:text-gray-400"
          >
            Favorites
          </p>
          <h1
            class="mt-1 text-3xl font-bold tracking-[-0.04em] text-gray-950 sm:text-4xl dark:text-white"
          >
            All favorites
          </h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Everything you’ve saved, in one place.
          </p>
        </div>
      </div>

      <label class="relative block w-full xl:max-w-xs">
        <span class="sr-only">Search favorite items</span>
        <svg
          class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          v-model="searchTerm"
          type="search"
          placeholder="Search favorites"
          class="focus:border-brand-500 focus:ring-brand-500/20 h-11 w-full rounded-xl border border-gray-300 bg-white pr-4 pl-10 text-sm text-gray-900 focus:ring-2 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
        />
      </label>
    </div>

    <div
      class="scrollbar-hidden mt-5 flex gap-2 overflow-x-auto pb-1"
      aria-label="Filter favorite items"
    >
      <button
        v-for="filter in filterOptions"
        :key="filter.key"
        type="button"
        class="focus:ring-brand-500/30 shrink-0 cursor-pointer rounded-full border px-3.5 py-2 text-sm font-medium focus:ring-2 focus:outline-none"
        :class="
          activeFilter === filter.key
            ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-950/50 dark:text-brand-200'
            : 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
        "
        :aria-pressed="activeFilter === filter.key"
        @click="activeFilter = filter.key"
      >
        {{ filter.label }}
      </button>
    </div>

    <ErrorBanner v-if="error" class="mt-5" :text="error.message" />

    <div
      v-if="loading && allItems.length === 0"
      class="mt-5 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
      role="status"
      aria-label="Loading favorite items"
    >
      <span class="sr-only">Loading favorite items…</span>
      <div
        v-for="index in 7"
        :key="index"
        class="flex animate-pulse items-center gap-3 border-b border-gray-200 px-4 py-3 last:border-b-0 dark:border-gray-800"
        aria-hidden="true"
      >
        <div class="h-14 w-14 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div class="flex-1 space-y-2">
          <div class="h-4 w-2/5 rounded bg-gray-200 dark:bg-gray-800" />
          <div class="h-3 w-3/5 rounded bg-gray-100 dark:bg-gray-800/70" />
        </div>
      </div>
    </div>

    <div
      v-else-if="filteredItems.length"
      class="mt-5 overflow-visible rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950/40"
    >
      <div
        class="hidden grid-cols-[3.5rem_minmax(0,1.25fr)_8rem_13rem_5.5rem_2.75rem] gap-3 border-b border-gray-200 px-4 py-2 text-[11px] font-semibold tracking-[0.08em] text-gray-500 uppercase sm:grid dark:border-gray-800 dark:text-gray-400"
      >
        <span aria-hidden="true" />
        <span>Title</span>
        <span>Type</span>
        <span>Source</span>
        <span>Published</span>
        <span class="sr-only">Actions</span>
      </div>
      <LibraryFavoriteRow
        v-for="item in filteredItems"
        :key="`${item.kind}-${item.id}`"
        :item="item"
        @removed="handleRemoved(item)"
      />
    </div>

    <div
      v-else-if="!loading"
      class="mt-5 rounded-xl border border-dashed border-gray-300 px-5 py-14 text-center dark:border-gray-700"
    >
      <BookmarkIcon class="mx-auto h-9 w-9 text-gray-400" />
      <h2 class="mt-3 font-semibold text-gray-900 dark:text-white">
        {{
          allItems.length
            ? 'No favorites match these filters'
            : 'No favorites yet'
        }}
      </h2>
      <p class="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
        {{
          allItems.length
            ? 'Try another content type or search term.'
            : 'Save discussions, images, comments, downloads, or forums and they will appear together here.'
        }}
      </p>
    </div>
  </section>
</template>
