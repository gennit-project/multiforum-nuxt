<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import ErrorBanner from '../../ErrorBanner.vue';
import LoadMore from '../../LoadMore.vue';
import SitewideDiscussionSidebar from './SitewideDiscussionSidebar.vue';
import SitewideDownloadListItem from './SitewideDownloadListItem.vue';
import DiscussionAlbum from '@/components/discussion/detail/DiscussionAlbum.vue';
import DownloadSkeletonCard from '@/components/download/DownloadSkeletonCard.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import { GET_SITE_WIDE_DISCUSSION_LIST } from '@/graphQLData/discussion/queries';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import { getFilterValuesFromParams } from './getDiscussionFilterValuesFromParams';
import {
  getSortFromQuery,
  getTimeFrameFromQuery,
} from '@/components/comments/getSortFromQuery';
import { config } from '@/config';
import { usernameVar } from '@/cache';
import type { SearchDiscussionValues } from '@/types/Discussion';
import type { Album, Discussion } from '@/__generated__/graphql';

const DISCUSSION_PAGE_LIMIT = 15;

type AlbumData = {
  discussion: Discussion;
  album: Album | null | undefined;
};

const route = useRoute();
const router = useRouter();

const filterValues = ref(
  getFilterValuesFromParams({
    route,
    channelId: '',
  })
);

const selectedChannels = computed(() => filterValues.value.channels);
const selectedTags = computed(() => filterValues.value.tags);
const searchInput = computed(() => filterValues.value.searchInput || '');

const activeSort = computed(() => getSortFromQuery(route.query));
const activeTimeFrame = computed(() => getTimeFrameFromQuery(route.query));

const {
  result: discussionResult,
  error: discussionError,
  loading: discussionLoading,
  refetch: refetchDiscussions,
  fetchMore,
} = useQuery(
  GET_SITE_WIDE_DISCUSSION_LIST,
  () => ({
    searchInput: searchInput.value,
    selectedChannels: selectedChannels.value,
    selectedTags: selectedTags.value,
    showArchived: false,
    hasDownload: true,
    loggedInUsername: usernameVar.value || null,
    options: {
      limit: DISCUSSION_PAGE_LIMIT,
      offset: 0,
      sort: activeSort.value,
      timeFrame: activeTimeFrame.value,
    },
  })
);

// Refetch when user logs in/out to update isFavorited status
watch(usernameVar, () => {
  refetchDiscussions();
});

const { result: getServerResult, error: getServerError } = useQuery(
  GET_SERVER_CONFIG,
  {
    serverName: config.serverName,
  },
  {
    fetchPolicy: 'cache-first',
  }
);

const serverConfig = computed(() => {
  if (getServerError.value || !getServerResult.value?.serverConfigs) {
    return null;
  }
  return getServerResult.value.serverConfigs?.[0] || null;
});

const discussions = computed(() => {
  if (!discussionResult.value?.getSiteWideDiscussionList) {
    return [];
  }
  return discussionResult.value.getSiteWideDiscussionList.discussions || [];
});

const aggregateDiscussionCount = computed(() => {
  if (!discussionResult.value?.getSiteWideDiscussionList) {
    return 0;
  }
  return (
    discussionResult.value.getSiteWideDiscussionList.aggregateDiscussionCount ||
    0
  );
});

const isInitialLoading = computed(
  () => discussionLoading.value && !discussionResult.value
);

const loadMore = () => {
  if (!discussionResult.value?.getSiteWideDiscussionList?.discussions) return;
  fetchMore({
    variables: {
      options: {
        limit: DISCUSSION_PAGE_LIMIT,
        offset:
          discussionResult.value.getSiteWideDiscussionList.discussions.length,
        // @ts-ignore
        sort: activeSort.value,
        // @ts-ignore
        timeFrame: activeTimeFrame.value,
      },
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;
      return {
        getSiteWideDiscussionList: {
          ...previousResult.getSiteWideDiscussionList,
          aggregateDiscussionCount:
            fetchMoreResult.getSiteWideDiscussionList.aggregateDiscussionCount,
          discussions: [
            ...previousResult.getSiteWideDiscussionList.discussions,
            ...fetchMoreResult.getSiteWideDiscussionList.discussions,
          ],
        },
      };
    },
  });
};

const updateFilters = (params: SearchDiscussionValues) => {
  const existingQuery = route.query;
  const queryParams: Record<string, string | string[]> = {};
  if (params.tags) queryParams.tags = params.tags;
  if (params.channels) queryParams.channels = params.channels;
  if (params.searchInput !== undefined)
    queryParams.searchInput = params.searchInput;
  if (params.showArchived !== undefined)
    queryParams.showArchived = params.showArchived.toString();

  router.replace({
    query: {
      ...existingQuery,
      ...queryParams,
    },
  });
};

const handleClickTag = (tagText: string) => {
  const currentQuery = route.query;

  const clearTags = () => {
    const newQuery = { ...route.query };
    delete newQuery['tags'];
    router.replace({ query: { ...newQuery } });
    if (!filterValues.value.tags) {
      filterValues.value.tags = [];
    }
    filterValues.value.tags = filterValues.value.tags.filter(
      (t: string) => t !== tagText
    );
  };

  const removeOnlyThisTag = () => {
    const newQuery = { ...route.query };
    if (newQuery.tags === null) {
      newQuery.tags = [];
    }
    if (typeof newQuery.tags === 'string') {
      newQuery.tags = [newQuery.tags];
    } else if (Array.isArray(newQuery.tags)) {
      newQuery.tags = newQuery.tags.filter(
        (tag): tag is string => typeof tag === 'string' && tag !== tagText
      );
    }
    router.replace({ query: { ...newQuery } });
    if (!filterValues.value.tags) {
      filterValues.value.tags = [];
    }
    filterValues.value.tags.push(tagText);
  };

  const alreadyFilteringByOnlyThisTag =
    currentQuery.tags &&
    typeof currentQuery.tags === 'string' &&
    tagText === currentQuery.tags;

  const alreadyFilteringByMultipleTagsIncludingThisTag =
    currentQuery.tags &&
    typeof currentQuery.tags === 'object' &&
    currentQuery.tags.includes(tagText);

  if (alreadyFilteringByOnlyThisTag) {
    clearTags();
  } else if (alreadyFilteringByMultipleTagsIncludingThisTag) {
    removeOnlyThisTag();
  } else {
    updateFilters({ tags: [tagText] });
  }
};

const openAlbumData = ref<AlbumData | null>(null);
const isAlbumLightboxOpen = ref(false);

watch(
  () => route.query,
  () => {
    if (route.query) {
      filterValues.value = getFilterValuesFromParams({
        route,
        channelId: '',
      });
    }
    if (
      discussionResult?.value?.getSiteWideDiscussionList?.discussions
        ?.length === 0
    ) {
      refetchDiscussions();
    }
  }
);

const handleOpenAlbum = (payload: AlbumData) => {
  openAlbumData.value = payload;
  isAlbumLightboxOpen.value = true;
};

const handleCloseAlbum = () => {
  openAlbumData.value = null;
  isAlbumLightboxOpen.value = false;
};
</script>

<template>
  <div class="flex justify-center">
    <div class="max-w-screen-2xl flex-1 bg-white dark:bg-black dark:text-white">
      <div class="relative w-full">
        <div
          class="flex flex-col divide-x divide-gray-300 dark:divide-gray-500 md:flex-row"
        >
          <div class="flex-1 md:px-2">
            <slot />
            <div
              v-if="isInitialLoading"
              class="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <DownloadSkeletonCard v-for="n in 6" :key="n" />
            </div>
            <ErrorBanner
              v-else-if="discussionError"
              class="max-w-5xl"
              :text="discussionError.message"
            />
            <p
              v-else-if="discussions.length === 0"
              class="my-6 flex gap-2 px-4"
            >
              <span class="dark:text-white"
                >There are no downloads to show.</span
              >

              <RequireAuth :full-width="false">
                <template #has-auth>
                  <nuxt-link
                    class="text-orange-500 underline"
                    :to="{ name: 'discussions-create' }"
                  >
                    Create one?
                  </nuxt-link>
                </template>
                <template #does-not-have-auth>
                  <span class="cursor-pointer text-orange-500 underline"
                    >Create one?</span
                  >
                </template>
              </RequireAuth>
            </p>
            <div v-else class="p-4">
              <ul
                class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                data-testid="sitewide-download-list"
              >
                <SitewideDownloadListItem
                  v-for="discussion in discussions"
                  :key="discussion.id"
                  :discussion="discussion"
                  :search-input="filterValues.searchInput"
                  :selected-tags="filterValues.tags"
                  @filter-by-tag="handleClickTag"
                  @open-album="handleOpenAlbum"
                />
              </ul>
              <div v-if="discussions.length">
                <LoadMore
                  class="mt-4 justify-self-center"
                  :loading="discussionLoading"
                  :reached-end-of-results="
                    aggregateDiscussionCount === discussions.length
                  "
                  @load-more="loadMore"
                />
              </div>
            </div>
          </div>
          <aside
            v-if="serverConfig"
            class="flex-shrink-0 md:sticky md:top-0 md:max-h-screen md:w-1/4 md:overflow-y-auto"
          >
            <SitewideDiscussionSidebar
              :server-config="serverConfig"
              class="px-4"
            />
          </aside>
        </div>
      </div>
    </div>
  </div>
  <DiscussionAlbum
    v-if="isAlbumLightboxOpen && openAlbumData?.album"
    :album="openAlbumData.album"
    :discussion-id="openAlbumData.discussion.id"
    :discussion-author="openAlbumData.discussion.Author?.username || ''"
    :show-edit-album="false"
    :start-in-lightbox="true"
    @close-lightbox="handleCloseAlbum"
  />
</template>
