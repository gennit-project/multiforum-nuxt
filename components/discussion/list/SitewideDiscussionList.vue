<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ErrorBanner from '../../ErrorBanner.vue';
import SitewideDiscussionListItem from './SitewideDiscussionListItem.vue';
import SitewideDiscussionSidebar from './SitewideDiscussionSidebar.vue';
import LoadMore from '../../LoadMore.vue';
import DiscussionDetailContent from '@/components/discussion/detail/DiscussionDetailContent.vue';
import { GET_SITE_WIDE_DISCUSSION_LIST } from '@/graphQLData/discussion/queries';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import { useQuery } from '@vue/apollo-composable';
import { useRoute } from 'nuxt/app';
import { getFilterValuesFromParams } from '@/components/event/list/filters/getEventFilterValuesFromParams';
import {
  getSortFromQuery,
  getTimeFrameFromQuery,
} from '@/components/comments/getSortFromQuery';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';
import { config } from '@/config';
import { useAppTheme } from '@/composables/useTheme';

const { theme } = useAppTheme();

const DISCUSSION_PAGE_LIMIT = 15;

// Props and Emits
const emit = defineEmits(['filterByTag', 'filterByChannel']);

// Setup function
const route = useRoute();
const uiStore = useUIStore();
const { expandSitewideDiscussions } = storeToRefs(uiStore);

const channelId = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const filterValues = ref(
  getFilterValuesFromParams({ route, channelId: channelId.value })
);
const isSitewideSidebarOpen = ref(false);
const selectedDiscussionId = ref('');
const selectedChannelId = ref('');

const selectedChannelsComputed = computed(() => {
  return filterValues.value.channels;
});

const selectedTagsComputed = computed(() => {
  return filterValues.value.tags;
});

const searchInputComputed = computed(() => {
  return filterValues.value.searchInput || '';
});

const activeSort = computed(() => {
  return getSortFromQuery(route.query);
});

const activeTimeFrame = computed(() => {
  return getTimeFrameFromQuery(route.query);
});

const {
  result: discussionResult,
  error: discussionError,
  loading: discussionLoading,
  refetch: refetchDiscussions,
  fetchMore,
} = useQuery(GET_SITE_WIDE_DISCUSSION_LIST, {
  searchInput: searchInputComputed,
  selectedChannels: selectedChannelsComputed,
  selectedTags: selectedTagsComputed,
  showArchived: false,
  hasDownload: false,
  options: {
    limit: DISCUSSION_PAGE_LIMIT,
    offset: 0,
    sort: activeSort,
    timeFrame: activeTimeFrame,
  },
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
  return getServerResult.value?.serverConfigs[0] || null;
});

const discussions = computed(() => {
  if (!discussionResult.value) {
    return [];
  }
  const { getSiteWideDiscussionList } = discussionResult.value;
  if (!getSiteWideDiscussionList) {
    return [];
  }
  return getSiteWideDiscussionList.discussions;
});

const selectedDiscussionTitle = computed(() => {
  if (!selectedDiscussionId.value) return '';
  const selected = discussions.value.find(
    (discussion) => discussion.id === selectedDiscussionId.value
  );
  return selected?.title || '';
});

const selectedDiscussionLink = computed(() => {
  if (!selectedDiscussionId.value || !selectedChannelId.value) return '';
  return `/forums/${selectedChannelId.value}/discussions/${selectedDiscussionId.value}`;
});

const selectedDiscussionChannels = computed(() => {
  if (!selectedDiscussionId.value) return [];
  const selected = discussions.value.find(
    (discussion) => discussion.id === selectedDiscussionId.value
  );
  if (!selected?.DiscussionChannels) return [];
  return selected.DiscussionChannels;
});

const selectedDiscussionChannelLinks = computed(() => {
  return selectedDiscussionChannels.value.map((discussionChannel) => {
    const commentCount = discussionChannel.CommentsAggregate?.count || 0;
    return {
      channelUniqueName: discussionChannel.channelUniqueName,
      commentCount,
      link: `/forums/${discussionChannel.channelUniqueName}/discussions/${selectedDiscussionId.value}`,
    };
  });
});

const aggregateDiscussionCount = computed(() => {
  if (!discussionResult.value) {
    return 0;
  }
  return discussionResult.value.getSiteWideDiscussionList
    .aggregateDiscussionCount;
});

const loadMore = () => {
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
            previousResult.getSiteWideDiscussionList.aggregateDiscussionCount,
          discussions: [
            ...previousResult.getSiteWideDiscussionList.discussions,
            ...fetchMoreResult.getSiteWideDiscussionList.discussions,
          ],
        },
      };
    },
  });
};

// Watchers
watch(
  () => route.query,
  () => {
    if (route.query) {
      filterValues.value = getFilterValuesFromParams({
        route,
        channelId: channelId.value,
      });
    }
    if (
      discussionResult?.value?.getDiscussionsInChannel?.discussionChannels
        ?.length === 0
    ) {
      refetchDiscussions();
    }
  }
);

// Methods
const filterByTag = (tag: string) => {
  emit('filterByTag', tag);
};

const filterByChannel = (channel: string) => {
  emit('filterByChannel', channel);
};

const handleSelectDiscussion = (payload: {
  discussionId: string;
  channelId: string;
}) => {
  selectedDiscussionId.value = payload.discussionId;
  selectedChannelId.value = payload.channelId;
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
            <div class="mt-2 flex justify-end lg:pr-2">
              <button
                v-if="serverConfig"
                type="button"
                class="hidden items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 lg:inline-flex"
                :aria-expanded="isSitewideSidebarOpen"
                aria-controls="sitewide-sidebar-drawer"
                @click="isSitewideSidebarOpen = true"
              >
                About
              </button>
            </div>
            <div
              v-if="
                discussionLoading && (!discussions || discussions.length === 0)
              "
              class="flex flex-col divide-y divide-gray-200 dark:divide-gray-700"
            >
              <div
                v-for="n in 5"
                :key="n"
                class="mb-2 flex flex-col gap-2 py-4"
              >
                <v-skeleton-loader class="w-3/4" type="text" :theme="theme" />
                <v-skeleton-loader class="w-1/3" type="text" :theme="theme" />
              </div>
            </div>
            <ErrorBanner
              v-else-if="discussionError"
              class="max-w-5xl"
              :text="discussionError.message"
            />
            <p
              v-else-if="discussions && discussions.length === 0"
              class="my-6 flex gap-2 px-4"
            >
              <span class="dark:text-white"
                >There are no discussions to show.</span
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
            <div v-if="discussions && discussions.length > 0" class="p-0">
              <ul
                class="m-0 flex flex-col divide-y divide-gray-200 bg-white p-0 shadow dark:divide-gray-700 dark:bg-black sm:rounded-lg"
                data-testid="sitewide-discussion-list"
                role="list"
              >
                <SitewideDiscussionListItem
                  v-for="discussion in discussionResult
                    .getSiteWideDiscussionList.discussions"
                  :key="`${discussion.id}-${expandSitewideDiscussions}`"
                  :default-expanded="expandSitewideDiscussions"
                  :discussion="discussion"
                  :is-selectable="true"
                  :score="discussion.score"
                  :search-input="filterValues.searchInput"
                  :selected-channels="filterValues.channels"
                  :selected-discussion-id="selectedDiscussionId"
                  :selected-tags="filterValues.tags"
                  @filter-by-channel="filterByChannel"
                  @filter-by-tag="filterByTag"
                  @select="handleSelectDiscussion"
                />
              </ul>
              <div
                v-if="
                  discussionResult.getSiteWideDiscussionList.discussions
                    .length > 0
                "
              >
                <LoadMore
                  class="ml-4 justify-self-center"
                  :loading="discussionLoading"
                  :reached-end-of-results="
                    aggregateDiscussionCount ===
                    discussionResult.getSiteWideDiscussionList.discussions
                      .length
                  "
                  @load-more="loadMore"
                />
              </div>
            </div>
          </div>
          <aside
            v-if="serverConfig"
            class="flex-shrink-0 md:sticky md:top-0 md:max-h-screen md:w-1/4 md:overflow-y-auto lg:hidden"
          >
            <SitewideDiscussionSidebar
              :server-config="serverConfig"
              class="px-4"
            />
          </aside>
          <aside
            class="hidden flex-shrink-0 lg:sticky lg:top-0 lg:flex lg:max-h-screen lg:w-1/2 lg:flex-col lg:overflow-y-auto lg:px-6 lg:py-4"
          >
            <div
              v-if="selectedDiscussionId"
              class="flex w-full flex-col justify-center px-2 py-4"
            >
              <h2 v-if="selectedDiscussionTitle" class="mb-3">
                <nuxt-link
                  v-if="selectedDiscussionLink"
                  :to="selectedDiscussionLink"
                  class="text-lg font-semibold text-gray-900 hover:underline dark:text-gray-100"
                >
                  {{ selectedDiscussionTitle }}
                </nuxt-link>
                <span
                  v-else
                  class="text-lg font-semibold text-gray-900 dark:text-gray-100"
                >
                  {{ selectedDiscussionTitle }}
                </span>
              </h2>
              <DiscussionDetailContent
                :discussion-id="selectedDiscussionId"
                :channel-id="selectedChannelId"
                :show-comments="false"
                class="w-full"
              />
              <div class="mt-6 w-full rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Select a forum to view comments
                </p>
                <ul
                  v-if="selectedDiscussionChannelLinks.length > 0"
                  class="flex flex-col gap-2"
                >
                  <li
                    v-for="channelLink in selectedDiscussionChannelLinks"
                    :key="channelLink.channelUniqueName"
                    class="flex items-center justify-between text-sm"
                  >
                    <span class="text-gray-700 dark:text-gray-200">
                      {{ channelLink.channelUniqueName }}
                    </span>
                    <a
                      :href="channelLink.link"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-orange-600 hover:underline dark:text-orange-400"
                    >
                      {{ channelLink.commentCount }}
                      {{
                        channelLink.commentCount === 1
                          ? 'comment'
                          : 'comments'
                      }}
                    </a>
                  </li>
                </ul>
                <p v-else class="text-sm text-gray-500 dark:text-gray-400">
                  No forum comment sections are available for this discussion.
                </p>
              </div>
            </div>
            <div
              v-else
              class="flex h-full items-center justify-center px-6 text-sm text-gray-500 dark:text-gray-300"
            >
              Select a discussion to view details.
            </div>
          </aside>
        </div>
        <div
          v-if="serverConfig && isSitewideSidebarOpen"
          class="fixed inset-0 z-40 hidden lg:block"
          aria-hidden="false"
        >
          <div
            class="absolute inset-0 bg-black/50"
            @click="isSitewideSidebarOpen = false"
          />
          <div
            id="sitewide-sidebar-drawer"
            class="absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto bg-white shadow-xl dark:bg-gray-900"
            role="dialog"
            aria-label="About this forum"
          >
            <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                About
              </span>
              <button
                type="button"
                class="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                @click="isSitewideSidebarOpen = false"
              >
                Close
              </button>
            </div>
            <SitewideDiscussionSidebar
              :server-config="serverConfig"
              class="px-4 py-4"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
