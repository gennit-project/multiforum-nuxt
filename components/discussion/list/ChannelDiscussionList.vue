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
import { GetDiscussionsInChannelDocument as GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA } from '@/__generated__/operations';
import { useUsername } from '@/composables/useAuthState';
import { provideForumRoleMembership } from '@/composables/useForumRoleMembership';
import { getDiscussionFilterValuesFromParams } from '@/utils/getDiscussionFilterValuesFromParams';
import {
  getSortFromQuery,
  getTimeFrameFromQuery,
} from '@/utils/getSortFromQuery';
import { mergeUniqueById } from '@/utils/mergeUniqueById';

const usernameVar = useUsername();

const DISCUSSION_PAGE_LIMIT = 25;

const emit = defineEmits(['filterByTag', 'filterByChannel']);

const route = useRoute();
const uiStore = useUIStore();
const { expandChannelDiscussions } = storeToRefs(uiStore);

const channelId = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

// Provide this channel's owner/moderator lists so the list items can show
// membership-derived Forum Admin / Forum Mod author badges.
provideForumRoleMembership(channelId);

const filterValues = computed(() =>
  getDiscussionFilterValuesFromParams({
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

const selectedDiscussionId = computed(() => {
  return typeof route.query.selectedDiscussionId === 'string'
    ? route.query.selectedDiscussionId
    : '';
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
} = useQuery(
  GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA,
  () => ({
    channelUniqueName: channelId.value,
    searchInput: searchInput.value || '',
    selectedTags: selectedTags.value || [],
    showArchived: showArchived.value || false,
    hasDownload: false,
    showUnanswered: showUnanswered.value,
    options: {
      limit: DISCUSSION_PAGE_LIMIT,
      offset: 0,
      sort: activeSort.value,
      timeFrame: activeTimeFrame.value,
    },
  }),
  { enabled: computed(() => !!channelId.value), keepPreviousResult: false }
);
const discussionChannels = computed(
  () =>
    discussionChannelResult.value?.getDiscussionsInChannel
      ?.discussionChannels || []
);
const listScope = computed(() =>
  JSON.stringify([
    channelId.value,
    searchInput.value,
    selectedTags.value,
    showArchived.value,
    showUnanswered.value,
    activeSort.value,
    activeTimeFrame.value,
  ])
);
// Refetch when user logs in/out to update isFavorited and upvote status
watch(
  () => usernameVar.value,
  () => {
    refetchDiscussions();
  }
);

const loadMore = () => {
  if (discussionLoading.value || !channelId.value) return;
  const scope = listScope.value;
  return fetchMore({
    variables: {
      options: {
        limit: DISCUSSION_PAGE_LIMIT,
        offset:
          discussionChannelResult.value?.getDiscussionsInChannel
            ?.discussionChannels.length,
        sort: activeSort.value,
        timeFrame: activeTimeFrame.value,
      },
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (
        scope !== listScope.value ||
        !fetchMoreResult?.getDiscussionsInChannel ||
        !previousResult.getDiscussionsInChannel
      )
        return previousResult;
      return {
        getDiscussionsInChannel: {
          ...previousResult.getDiscussionsInChannel,
          aggregateDiscussionChannelsCount:
            fetchMoreResult.getDiscussionsInChannel
              .aggregateDiscussionChannelsCount,
          discussionChannels: mergeUniqueById(
            previousResult.getDiscussionsInChannel.discussionChannels,
            fetchMoreResult.getDiscussionsInChannel.discussionChannels
          ),
        },
      };
    },
  });
};

const showModProfileModal = ref(false);

onMounted(() => {
  if (
    discussionChannelResult.value?.getDiscussionsInChannel?.discussionChannels
      .length === 0
  ) {
    refetchDiscussions();
  }
});

watch(channelId, (newChannelId, oldChannelId) => {
  if (newChannelId !== oldChannelId) {
    uiStore.clearSelectedChannelDiscussion();
  }
});

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
      ?.aggregateDiscussionChannelsCount ===
    discussionChannelResult.value?.getDiscussionsInChannel?.discussionChannels
      .length
  );
});

watch(
  [selectedDiscussionId, discussionChannelResult],
  ([newSelectedDiscussionId, newDiscussionChannelResult]) => {
    if (!newSelectedDiscussionId) {
      uiStore.clearSelectedChannelDiscussion();
      return;
    }

    const selectedDiscussionChannel =
      newDiscussionChannelResult?.getDiscussionsInChannel?.discussionChannels?.find(
        (discussionChannel) =>
          discussionChannel.discussionId === newSelectedDiscussionId
      );

    if (!selectedDiscussionChannel?.Discussion?.title) {
      return;
    }

    uiStore.setSelectedChannelDiscussionSelection({
      discussionId: newSelectedDiscussionId,
      title: selectedDiscussionChannel.Discussion.title,
    });
  },
  {
    immediate: true,
  }
);
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
            <SkeletonLoader class="w-3/4" type="text" />
            <SkeletonLoader class="w-1/3" type="text" />
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
                class="text-brand-500 underline"
              >
                Create one?
              </nuxt-link>
            </template>
            <template #does-not-have-auth>
              <button
                type="button"
                aria-label="Log in to create a discussion"
                class="text-brand-500 cursor-pointer underline"
              >
                Create one?
              </button>
            </template>
          </RequireAuth>
        </p>

        <ul
          v-else-if="discussionChannels.length > 0"
          class="flex flex-col divide-y divide-gray-200 dark:divide-gray-700"
          data-testid="channel-discussion-list"
        >
          <ChannelDiscussionListItem
            v-for="discussionChannel in discussionChannels"
            :key="`${discussionChannel.id}-${expandChannelDiscussions}`"
            :discussion="discussionChannel.Discussion"
            :discussion-channel="discussionChannel"
            :search-input="searchInput"
            :selected-tags="selectedTags || []"
            :selected-channels="selectedChannels || []"
            :default-expanded="expandChannelDiscussions"
            :is-selectable="true"
            :selected-discussion-id="selectedDiscussionId"
            @open-mod-profile="showModProfileModal = true"
            @filter-by-tag="filterByTag"
            @filter-by-channel="filterByChannel"
          />
        </ul>
        <div v-if="discussionChannels.length > 0">
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
