<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter, useHead } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import SearchBar from '@/components/SearchBar.vue';
import FilterChip from '@/components/FilterChip.vue';
import ChannelIcon from '@/components/icons/ChannelIcon.vue';
import SearchableForumList from '@/components/channel/SearchableForumList.vue';
import { SEARCH_COMMENTS } from '@/graphQLData/comment/queries';
import { updateFilters } from '@/utils/routerUtils';
import type { Comment } from '@/__generated__/graphql';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import AvatarComponent from '@/components/AvatarComponent.vue';
import { relativeTime } from '@/utils';
import LoadMore from '@/components/LoadMore.vue';

const route = useRoute();
const router = useRouter();

const RESULTS_PER_PAGE = 20;

const searchInput = computed(() =>
  typeof route.query.searchInput === 'string' ? route.query.searchInput : ''
);

// Parse channels from route query
const getChannelsFromRoute = (): string[] => {
  const channels = route.query.channels;
  if (typeof channels === 'string') {
    return [channels];
  }
  if (Array.isArray(channels)) {
    return channels.filter(
      (value): value is string => typeof value === 'string'
    );
  }
  return [];
};

// Use local ref for selected channels to handle rapid toggles properly
const selectedChannels = ref<string[]>(getChannelsFromRoute());

// Sync local state when route changes (e.g., browser back/forward)
watch(
  () => route.query.channels,
  () => {
    selectedChannels.value = getChannelsFromRoute();
  }
);

const channelLabel = computed(() =>
  selectedChannels.value.length > 0
    ? `Forums (${selectedChannels.value.length})`
    : 'All forums'
);

const pageTitle = computed(() => {
  const serverName = import.meta.env.VITE_SERVER_DISPLAY_NAME;
  return `Comment search | ${serverName}`;
});

useHead({
  title: pageTitle,
});

const shouldAutoFocus = computed(() => route.query.searchOpen === 'true');

const updateSearchInput = (value: string) => {
  updateFilters({
    router,
    route,
    params: {
      searchInput: value,
      searchOpen: 'true',
    },
  });
};

const toggleSelectedChannel = (channelUniqueName: string) => {
  // Update local state first (handles rapid toggles properly)
  const index = selectedChannels.value.indexOf(channelUniqueName);
  if (index === -1) {
    selectedChannels.value.push(channelUniqueName);
  } else {
    selectedChannels.value.splice(index, 1);
  }
  // Then sync to route
  updateFilters({
    router,
    route,
    params: {
      channels: selectedChannels.value.length > 0 ? [...selectedChannels.value] : undefined,
    },
  });
};

// Build the where clause for the GraphQL query
const commentWhere = computed(() => {
  const where: Record<string, unknown> = {
    // Exclude feedback comments and issue comments from search
    isFeedbackComment_NOT: true,
    Issue: null,
  };

  // Text search (case-insensitive using regex)
  if (searchInput.value.trim()) {
    // Escape special regex characters and use (?i) for case-insensitive matching
    const escapedSearch = searchInput.value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    where.text_MATCHES = `(?i).*${escapedSearch}.*`;
  }

  // Channel filter - comments can be on discussions via DiscussionChannel or on events via Event
  if (selectedChannels.value.length > 0) {
    where.OR = [
      {
        DiscussionChannel: {
          channelUniqueName_IN: selectedChannels.value,
        },
      },
      {
        Event: {
          EventChannels_SOME: {
            channelUniqueName_IN: selectedChannels.value,
          },
        },
      },
    ];
  }

  return where;
});

const commentOptions = computed(() => ({
  limit: RESULTS_PER_PAGE,
  offset: 0,
  sort: [{ createdAt: 'DESC' }],
}));

// Skip query if no search input
const shouldSkipQuery = computed(() => !searchInput.value.trim());

const {
  result: searchResult,
  loading: searchLoading,
  error: searchError,
  fetchMore,
} = useQuery(
  SEARCH_COMMENTS,
  computed(() => ({
    where: commentWhere.value,
    options: commentOptions.value,
  })),
  {
    enabled: computed(() => !shouldSkipQuery.value),
    fetchPolicy: 'cache-and-network',
  }
);

const comments = computed(() => searchResult.value?.comments ?? []);
const totalCount = computed(
  () => searchResult.value?.commentsAggregate?.count ?? 0
);
const hasMore = computed(() => comments.value.length < totalCount.value);

const loadingMore = ref(false);

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return;

  loadingMore.value = true;
  try {
    await fetchMore({
      variables: {
        where: commentWhere.value,
        options: {
          ...commentOptions.value,
          offset: comments.value.length,
        },
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          ...fetchMoreResult,
          comments: [...(prev.comments || []), ...fetchMoreResult.comments],
        };
      },
    });
  } finally {
    loadingMore.value = false;
  }
};

// Get author info from comment
const getAuthorUsername = (comment: Comment): string => {
  if (comment.CommentAuthor?.__typename === 'User') {
    return comment.CommentAuthor.username ?? 'Unknown';
  }
  if (comment.CommentAuthor?.__typename === 'ModerationProfile') {
    return comment.CommentAuthor.displayName ?? 'Unknown';
  }
  return 'Unknown';
};

const getAuthorDisplayName = (comment: Comment): string => {
  if (comment.CommentAuthor?.__typename === 'User') {
    return comment.CommentAuthor.displayName || comment.CommentAuthor.username || 'Unknown';
  }
  if (comment.CommentAuthor?.__typename === 'ModerationProfile') {
    return comment.CommentAuthor.displayName ?? 'Unknown';
  }
  return 'Unknown';
};

const getAuthorProfilePic = (comment: Comment): string => {
  if (comment.CommentAuthor?.__typename === 'User') {
    return comment.CommentAuthor.profilePicURL ?? '';
  }
  return '';
};

// Get the context link for the comment (where it was posted)
const getContextLink = (comment: Comment) => {
  if (comment.DiscussionChannel) {
    return {
      name: 'forums-forumId-discussions-discussionId',
      params: {
        forumId: comment.DiscussionChannel.channelUniqueName,
        discussionId: comment.DiscussionChannel.discussionId,
      },
    };
  }
  if (comment.Event) {
    return {
      name: 'events-eventId',
      params: {
        eventId: comment.Event.id,
      },
    };
  }
  return null;
};

const getContextText = (comment: Comment) => {
  if (comment.DiscussionChannel?.Discussion) {
    return comment.DiscussionChannel.Discussion.title;
  }
  if (comment.Event) {
    return comment.Event.title;
  }
  return 'Unknown';
};

const getContextForum = (comment: Comment) => {
  if (comment.DiscussionChannel) {
    return comment.DiscussionChannel.channelUniqueName;
  }
  return null;
};
</script>

<template>
  <NuxtLayout>
    <div class="mx-auto max-w-3xl px-4 py-6 text-gray-900 dark:text-gray-100">
      <h1 class="text-lg font-semibold">Comment search</h1>

      <!-- Search bar and filters -->
      <div class="mt-4 flex flex-wrap items-center gap-2">
        <div class="flex-grow">
          <SearchBar
            :auto-focus="shouldAutoFocus"
            :initial-value="searchInput"
            :search-placeholder="'Search comments'"
            :small="true"
            :test-id="'comment-search-input'"
            :debounce-ms="300"
            @update-search-input="updateSearchInput"
          />
        </div>
        <FilterChip
          class="align-middle"
          :data-testid="'forum-filter-button'"
          :label="channelLabel"
          :highlighted="selectedChannels.length > 0"
        >
          <template #icon>
            <ChannelIcon class="-ml-0.5 mr-2 h-4 w-4" />
          </template>
          <template #content>
            <div class="relative w-96">
              <SearchableForumList
                :selected-channels="selectedChannels"
                @toggle-selection="toggleSelectedChannel"
              />
            </div>
          </template>
        </FilterChip>
      </div>

      <!-- Results section -->
      <div class="mt-6">
        <!-- No search input message -->
        <p
          v-if="!searchInput.trim()"
          class="text-sm text-gray-600 dark:text-gray-400"
        >
          Enter a search term to find comments.
        </p>

        <!-- Loading state -->
        <div
          v-else-if="searchLoading && comments.length === 0"
          class="text-sm text-gray-600 dark:text-gray-400"
        >
          Searching...
        </div>

        <!-- Error state -->
        <div
          v-else-if="searchError"
          class="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300"
        >
          Error loading comments: {{ searchError.message }}
        </div>

        <!-- Results -->
        <template v-else>
          <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {{ totalCount }} comment{{ totalCount !== 1 ? 's' : '' }} found
          </p>

          <div v-if="comments.length === 0" class="text-sm text-gray-500">
            No comments match your search.
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <!-- Comment header -->
              <div class="mb-2 flex items-center gap-2">
                <AvatarComponent
                  :src="getAuthorProfilePic(comment)"
                  :text="getAuthorUsername(comment)"
                  :is-small="true"
                />
                <div class="text-sm">
                  <router-link
                    v-if="comment.CommentAuthor?.__typename === 'User'"
                    :to="{
                      name: 'u-username',
                      params: { username: getAuthorUsername(comment) },
                    }"
                    class="font-medium text-gray-900 hover:underline dark:text-gray-100"
                  >
                    {{ getAuthorDisplayName(comment) }}
                  </router-link>
                  <span v-else class="font-medium text-gray-900 dark:text-gray-100">
                    {{ getAuthorDisplayName(comment) }}
                  </span>
                  <span class="ml-2 text-gray-500 dark:text-gray-400">
                    {{ relativeTime(comment.createdAt) }}
                  </span>
                </div>
              </div>

              <!-- Comment text -->
              <div class="mb-3 text-sm">
                <MarkdownPreview
                  :text="comment.text || ''"
                  :word-limit="200"
                  :disable-gallery="true"
                />
              </div>

              <!-- Context link -->
              <div
                v-if="getContextLink(comment)"
                class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
              >
                <span>in</span>
                <router-link
                  :to="getContextLink(comment)!"
                  class="text-orange-600 hover:underline dark:text-orange-400"
                >
                  {{ getContextText(comment) }}
                </router-link>
                <span v-if="getContextForum(comment)">
                  ({{ getContextForum(comment) }})
                </span>
              </div>
            </div>
          </div>

          <!-- Load more -->
          <LoadMore
            :loading="loadingMore"
            :reached-end-of-results="!hasMore"
            class="mt-4"
            @load-more="loadMore"
          />
        </template>
      </div>
    </div>
  </NuxtLayout>
</template>
