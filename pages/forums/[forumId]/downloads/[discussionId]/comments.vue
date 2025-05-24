<script setup lang="ts">
  import { computed, ref } from "vue";
  import { useRoute } from "nuxt/app";
  import { useQuery } from "@vue/apollo-composable";
  import { GET_DISCUSSION } from "@/graphQLData/discussion/queries";
  import {
    GET_DISCUSSION_COMMENTS,
    GET_DISCUSSION_CHANNEL_COMMENT_AGGREGATE,
    GET_DISCUSSION_CHANNEL_ROOT_COMMENT_AGGREGATE,
  } from "@/graphQLData/comment/queries";
  import { modProfileNameVar } from "@/cache";
  import DiscussionCommentsWrapper from "@/components/discussion/detail/DiscussionCommentsWrapper.vue";
  import DiscussionRootCommentFormWrapper from "@/components/discussion/form/DiscussionRootCommentFormWrapper.vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import ErrorBanner from "@/components/ErrorBanner.vue";
  import InfoBanner from "@/components/InfoBanner.vue";
  import type { Comment } from "@/__generated__/graphql";

  const COMMENT_LIMIT = 50;

  const route = useRoute();
  const offset = ref(0);

  const discussionId = computed(() => {
    return typeof route.params.discussionId === "string" ? route.params.discussionId : "";
  });

  const channelId = computed(() => {
    return typeof route.params.forumId === "string" ? route.params.forumId : "";
  });

  const loggedInUserModName = computed(() => modProfileNameVar.value);

  const { result: getDiscussionResult } = useQuery(GET_DISCUSSION, {
    id: discussionId,
    loggedInModName: loggedInUserModName,
    channelUniqueName: channelId.value,
  });

  const discussion = computed(() => getDiscussionResult.value?.discussions[0] || null);
  const activeDiscussionChannel = computed(() => {
    return discussion.value?.DiscussionChannels?.find(
      (dc: any) => dc.channelUniqueName === channelId.value
    );
  });

  const {
    result: getDiscussionChannelResult,
    error: getDiscussionChannelError,
    loading: getDiscussionChannelLoading,
    fetchMore: fetchMoreComments,
  } = useQuery(
    GET_DISCUSSION_COMMENTS,
    {
      discussionId,
      channelUniqueName: channelId,
      offset: 0,
      limit: COMMENT_LIMIT,
    },
    {
      fetchPolicy: "cache-first",
    }
  );

  const { result: getDiscussionChannelCommentAggregateResult } = useQuery(
    GET_DISCUSSION_CHANNEL_COMMENT_AGGREGATE,
    {
      discussionId,
      channelUniqueName: channelId,
    },
    {
      fetchPolicy: "cache-first",
    }
  );

  const { result: getDiscussionChannelRootCommentAggregateResult } = useQuery(
    GET_DISCUSSION_CHANNEL_ROOT_COMMENT_AGGREGATE,
    {
      discussionId,
      channelUniqueName: channelId,
    },
    {
      fetchPolicy: "cache-first",
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
    getDiscussionChannelError.value
      ? []
      : getDiscussionChannelResult.value?.getCommentSection?.Comments || []
  );

  const loadedRootCommentCount = computed(() => {
    const rootComments = comments.value.filter(
      (comment: Comment) => comment.ParentComment === null
    );
    return rootComments.length;
  });

  const commentCount = computed(() => activeDiscussionChannel.value?.CommentsAggregate?.count || 0);

  const aggregateCommentCount = computed(() => {
    return (
      getDiscussionChannelCommentAggregateResult.value?.discussionChannels[0]?.CommentsAggregate
        ?.count || 0
    );
  });

  const aggregateRootCommentCount = computed(() => {
    return (
      getDiscussionChannelRootCommentAggregateResult.value?.discussionChannels[0]?.CommentsAggregate
        ?.count || 0
    );
  });

  const loadMore = () => {
    fetchMoreComments({
      variables: {
        offset: getDiscussionChannelResult.value?.getCommentSection?.Comments.length || 0,
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        if (!fetchMoreResult) return previousResult;
        offset.value += fetchMoreResult.getCommentSection.Comments.length;
        return {
          ...previousResult,
          getCommentSection: {
            ...previousResult.getCommentSection,
            Comments: [
              ...previousResult.getCommentSection.Comments,
              ...fetchMoreResult.getCommentSection.Comments,
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

  const discussionAuthor = computed(() => discussion.value?.Author?.username || "");
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