<script setup lang="ts">
import {
  GetCommentSectionDocument as GET_DISCUSSION_COMMENTS,
  GetDiscussionChannelCommentAggregateDocument as GET_DISCUSSION_CHANNEL_COMMENT_AGGREGATE,
  GetDiscussionChannelRootCommentAggregateDocument as GET_DISCUSSION_CHANNEL_ROOT_COMMENT_AGGREGATE,
  GetDiscussionDocument as GET_DISCUSSION,
} from '@/__generated__/operations';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';

import { useModProfileName, useUsername } from '@/composables/useAuthState';
import DiscussionCommentsWrapper from '@/components/discussion/detail/DiscussionCommentsWrapper.vue';
import DiscussionRootCommentFormWrapper from '@/components/discussion/form/DiscussionRootCommentFormWrapper.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import InfoBanner from '@/components/InfoBanner.vue';
import type { DiscussionPresentation as Discussion } from '@/types/DiscussionPresentation';
import { getSortFromQuery } from '@/utils/getSortFromQuery';

const modProfileNameVar = useModProfileName();
const usernameVar = useUsername();

const COMMENT_LIMIT = 50;

// The parent download page passes the already-loaded discussion via <NuxtPage>,
// so skip the redundant GET_DISCUSSION fetch when switching to this tab.
const props = defineProps<{
  discussion?: Discussion;
}>();

const route = useRoute();

const discussionId = computed(() => {
  return typeof route.params.discussionId === 'string'
    ? route.params.discussionId
    : '';
});

const channelId = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const loggedInUserModName = computed(() => modProfileNameVar.value);

const { result: getDiscussionResult } = useQuery(
  GET_DISCUSSION,
  () => ({
    id: discussionId.value,
    loggedInModName: loggedInUserModName.value,
    channelUniqueName: channelId.value,
  }),
  {
    enabled: computed(
      () => !!discussionId.value && props.discussion?.id !== discussionId.value
    ),
  }
);

const discussion = computed(
  () =>
    (props.discussion?.id === discussionId.value ? props.discussion : null) ||
    getDiscussionResult.value?.discussions?.find(
      (item) => item.id === discussionId.value
    ) ||
    null
);
const activeDiscussionChannel = computed(() => {
  return discussion.value?.DiscussionChannels?.find(
    (dc) => dc.channelUniqueName === channelId.value
  );
});

const {
  result: getDiscussionChannelResult,
  error: getDiscussionChannelError,
  loading: getDiscussionChannelLoading,
  fetchMore: fetchMoreComments,
  refetch: refetchDiscussionChannel,
} = useQuery(
  GET_DISCUSSION_COMMENTS,
  () => ({
    discussionId: discussionId.value,
    channelUniqueName: channelId.value,
    modName: loggedInUserModName.value,
    offset: 0,
    limit: COMMENT_LIMIT,
    sort: getSortFromQuery(route.query),
  }),
  {
    fetchPolicy: 'cache-first',
  }
);

watch(
  () => usernameVar.value,
  (newUsername, prevUsername) => {
    if (!newUsername || newUsername === prevUsername) return;
    refetchDiscussionChannel();
  }
);

onMounted(() => {
  if (usernameVar.value) {
    refetchDiscussionChannel();
  }
});

const { result: getDiscussionChannelCommentAggregateResult } = useQuery(
  GET_DISCUSSION_CHANNEL_COMMENT_AGGREGATE,
  () => ({
    discussionId: discussionId.value,
    channelUniqueName: channelId.value,
  }),
  {
    fetchPolicy: 'cache-first',
  }
);

const { result: getDiscussionChannelRootCommentAggregateResult } = useQuery(
  GET_DISCUSSION_CHANNEL_ROOT_COMMENT_AGGREGATE,
  () => ({
    discussionId: discussionId.value,
    channelUniqueName: channelId.value,
  }),
  {
    fetchPolicy: 'cache-first',
  }
);

const isArchived = computed(() => {
  if (!activeDiscussionChannel.value) {
    return true;
  }
  return activeDiscussionChannel.value?.archived || false;
});

const locked = computed(() => {
  if (!activeDiscussionChannel.value) {
    return true;
  }
  return activeDiscussionChannel.value?.locked || false;
});

const comments = computed(() =>
  getDiscussionChannelError.value || getDiscussionChannelLoading.value
    ? []
    : getDiscussionChannelResult.value?.getCommentSection?.DiscussionChannel
          ?.discussionId === discussionId.value &&
        getDiscussionChannelResult.value.getCommentSection.DiscussionChannel
          .channelUniqueName === channelId.value
      ? getDiscussionChannelResult.value.getCommentSection.Comments.filter(
          (comment) => !!comment?.id
        )
      : []
);

const loadedRootCommentCount = computed(() => {
  const rootComments = comments.value.filter(
    (comment) => comment.ParentComment === null
  );
  return rootComments.length;
});

const commentCount = computed(
  () =>
    activeDiscussionChannel.value?.CommentsConnection?.aggregate?.count
      ?.nodes || 0
);

const aggregateCommentCount = computed(() => {
  return (
    getDiscussionChannelCommentAggregateResult.value?.discussionChannels?.find(
      (channel) => channel.id === activeDiscussionChannel.value?.id
    )?.CommentsConnection?.aggregate?.count?.nodes || 0
  );
});

const aggregateRootCommentCount = computed(() => {
  return (
    getDiscussionChannelRootCommentAggregateResult.value?.discussionChannels?.find(
      (channel) => channel.id === activeDiscussionChannel.value?.id
    )?.CommentsConnection?.aggregate?.count?.nodes || 0
  );
});

const loadMore = () => {
  const requestScope = [
    discussionId.value,
    channelId.value,
    getSortFromQuery(route.query),
    loggedInUserModName.value,
  ].join('\0');
  fetchMoreComments({
    variables: {
      offset:
        getDiscussionChannelResult.value?.getCommentSection?.Comments.length ||
        0,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (
        requestScope !==
          [
            discussionId.value,
            channelId.value,
            getSortFromQuery(route.query),
            loggedInUserModName.value,
          ].join('\0') ||
        !previousResult.getCommentSection ||
        !fetchMoreResult?.getCommentSection ||
        fetchMoreResult.getCommentSection.DiscussionChannel?.discussionId !==
          discussionId.value ||
        fetchMoreResult.getCommentSection.DiscussionChannel
          .channelUniqueName !== channelId.value
      )
        return previousResult;
      return {
        ...previousResult,
        getCommentSection: {
          ...previousResult.getCommentSection,
          Comments: [
            ...new Map(
              [
                ...previousResult.getCommentSection.Comments,
                ...fetchMoreResult.getCommentSection.Comments,
              ]
                .filter((item) => !!item?.id)
                .map((item) => [item.id, item])
            ).values(),
          ],
        },
      };
    },
  });
};

const reachedEndOfResults = computed(
  () =>
    loadedRootCommentCount.value >= aggregateRootCommentCount.value ||
    loadedRootCommentCount.value >= commentCount.value
);

const discussionAuthor = computed(
  () => discussion.value?.Author?.username || ''
);
const previousOffset = ref(0);
</script>

<template>
  <div class="px-2 pt-2">
    <LoadingSpinner
      v-if="getDiscussionChannelLoading && !comments.length"
      class="flex justify-center py-4"
      :loading-text="'Loading comments...'"
    />
    <ErrorBanner
      v-else-if="getDiscussionChannelError"
      :text="getDiscussionChannelError.message"
    />
    <InfoBanner
      v-else-if="locked"
      text="This download is locked. New comments cannot be added."
    />
    <DiscussionCommentsWrapper
      v-else
      :key="activeDiscussionChannel?.id"
      :aggregate-comment-count="aggregateCommentCount || 0"
      :comments="comments"
      :discussion-author="discussionAuthor || ''"
      :discussion-channel="activeDiscussionChannel || undefined"
      :loading="getDiscussionChannelLoading"
      :locked="locked"
      :mod-name="loggedInUserModName"
      :previous-offset="previousOffset"
      :reached-end-of-results="reachedEndOfResults"
      @load-more="loadMore"
    >
      <DiscussionRootCommentFormWrapper
        v-if="activeDiscussionChannel && !isArchived && !locked"
        :key="`${channelId}${discussionId}`"
        :channel-id="channelId"
        class="pr-1"
        :discussion-channel="activeDiscussionChannel || undefined"
        :mod-name="loggedInUserModName"
        :previous-offset="previousOffset"
      />
    </DiscussionCommentsWrapper>
  </div>
</template>
