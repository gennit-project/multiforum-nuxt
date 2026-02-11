<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';
import ChannelDiscussionListItem from './ChannelDiscussionListItem.vue';
import LoadMore from '../../LoadMore.vue';
import ErrorBanner from '../../ErrorBanner.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import { GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA } from '@/graphQLData/discussion/queries';
import { usernameVar } from '@/cache';
import { getFilterValuesFromParams } from '@/components/discussion/list/getDiscussionFilterValuesFromParams';
import {
  getSortFromQuery,
  getTimeFrameFromQuery,
} from '@/components/comments/getSortFromQuery';
import { useAppTheme } from '@/composables/useTheme';

const { theme } = useAppTheme();

const DISCUSSION_PAGE_LIMIT = 25;

const emit = defineEmits(['filterByTag', 'filterByChannel']);

const route = useRoute();
const uiStore = useUIStore();
const { expandChannelDiscussions, selectedChannelDiscussionId } =
  storeToRefs(uiStore);

const channelId = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const filterValues = ref(
  getFilterValuesFromParams({
    route,
    channelId: channelId.value,
  })
);

const activeSort = computed(() => {
  return getSortFromQuery(route.query);
});

const activeTimeFrame = computed(() => {
  return getTimeFrameFromQuery(route.query);
});

const searchInput = computed(() => {
  return filterValues.value.searchInput;
});

const selectedTags = computed(() => {
  return filterValues.value.tags;
});

const selectedChannels = computed(() => {
  return filterValues.value.channels;
});

const showArchived = computed(() => {
  return filterValues.value.showArchived;
});

const showUnanswered = computed(() => {
  return filterValues.value.showUnanswered;
});

const {
  result: discussionChannelResult,
  error: discussionError,
  loading: discussionLoading,
  refetch: refetchDiscussions,
  fetchMore,
} = useQuery(GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA, {
  channelUniqueName: channelId,
  searchInput,
  selectedTags,
  showArchived,
  hasDownload: false,
  showUnanswered,
  options: {
    limit: DISCUSSION_PAGE_LIMIT,
    offset: 0,
    sort: activeSort,
    timeFrame: activeTimeFrame,
  },
});
// Refetch when user logs in/out to update isFavorited and upvote status
watch(
  () => usernameVar.value,
  () => {
    refetchDiscussions();
  }
);

const loadMore = () => {
  fetchMore({
    variables: {
      options: {
        limit: DISCUSSION_PAGE_LIMIT,
        offset:
          discussionChannelResult.value?.getDiscussionsInChannel
            .discussionChannels.length,
        // @ts-ignore
        sort: activeSort.value,
        // @ts-ignore
        timeFrame: activeTimeFrame.value,
      },
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;
      return {
        getDiscussionsInChannel: {
          ...previousResult.getDiscussionsInChannel,
          aggregateDiscussionChannelsCount:
            fetchMoreResult.getDiscussionsInChannel
              .aggregateDiscussionChannelsCount,
          discussionChannels: [
            ...previousResult.getDiscussionsInChannel.discussionChannels,
            ...fetchMoreResult.getDiscussionsInChannel.discussionChannels,
          ],
        },
      };
    },
  });
};

const showModProfileModal = ref(false);

onMounted(() => {
  if (
    discussionChannelResult.value?.getDiscussionsInChannel.discussionChannels
      .length === 0
  ) {
    refetchDiscussions();
  }
});

watch(
  () => route.query,
  () => {
    if (route.query) {
      filterValues.value = getFilterValuesFromParams({
        route,
        channelId: channelId.value,
      });
    }
  }
);

watch(
  channelId,
  (newChannelId, oldChannelId) => {
    if (newChannelId !== oldChannelId) {
      uiStore.clearSelectedChannelDiscussion();
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

const reachedEndOfResults = computed(() => {
  return (
    discussionChannelResult.value?.getDiscussionsInChannel
      .aggregateDiscussionChannelsCount ===
    discussionChannelResult.value?.getDiscussionsInChannel?.discussionChannels
      .length
  );
});

const handleSelectDiscussion = (payload: {
  discussionId: string;
  title: string;
}) => {
  uiStore.setSelectedChannelDiscussionSelection({
    discussionId: payload.discussionId,
    title: payload.title,
  });
};
</script>

<template>
  <div class="px-2">
    <div>
      <div>
        <slot />
        <div
          v-if="!discussionChannelResult && discussionLoading"
          class="flex flex-col divide-y divide-gray-200 dark:divide-gray-700"
        >
          <div v-for="n in 5" :key="n" class="mb-2 flex flex-col gap-2 py-4">
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
          v-else-if="
            discussionChannelResult?.getDiscussionsInChannel?.discussionChannels
              ?.length === 0
          "
          class="flex gap-2 p-4"
        >
          <span class="dark:text-white">There are no discussions to show.</span>

          <RequireAuth :full-width="false">
            <template #has-auth>
              <nuxt-link
                v-if="channelId"
                :to="{
                  name: 'forums-forumId-discussions-create',
                  params: {
                    forumId: channelId,
                  },
                }"
                class="text-orange-500 underline"
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

        <ul
          v-else-if="
            discussionChannelResult?.getDiscussionsInChannel?.discussionChannels
              ?.length > 0
          "
          class="flex flex-col divide-y divide-gray-200 dark:divide-gray-700"
          data-testid="channel-discussion-list"
        >
          <ChannelDiscussionListItem
            v-for="discussionChannel in discussionChannelResult
              .getDiscussionsInChannel.discussionChannels"
            :key="`${discussionChannel.id}-${expandChannelDiscussions}`"
            :discussion="discussionChannel.Discussion"
            :discussion-channel="discussionChannel"
            :search-input="searchInput"
            :selected-tags="selectedTags"
            :selected-channels="selectedChannels"
            :default-expanded="expandChannelDiscussions"
            :is-selectable="true"
            :selected-discussion-id="selectedChannelDiscussionId"
            @open-mod-profile="showModProfileModal = true"
            @filter-by-tag="filterByTag"
            @filter-by-channel="filterByChannel"
            @select="handleSelectDiscussion"
          />
        </ul>
        <div
          v-if="
            discussionChannelResult?.getDiscussionsInChannel?.discussionChannels
              ?.length > 0
          "
        >
          <LoadMore
            class="mb-6 justify-self-center"
            :loading="discussionLoading"
            :reached-end-of-results="reachedEndOfResults"
            @load-more="loadMore"
          />
        </div>
      </div>
    </div>
  </div>
</template>
