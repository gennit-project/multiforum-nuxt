<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useRoute } from 'nuxt/app';
import ArchivedCommentText from '@/components/comments/ArchivedCommentText.vue';
import Comment from '@/components/comments/Comment.vue';
import InfoBanner from '@/components/InfoBanner.vue';
import LoadMore from '@/components/LoadMore.vue';
import { GetUserCommentsDocument as GET_USER_COMMENTS } from '@/__generated__/operations';
import type { GetUserCommentsQuery } from '@/__generated__/operations';
import HydratedProfileComment from '@/components/user/HydratedProfileComment.vue';
import { useSelectedChannelsFromQuery } from '@/composables/useSelectedChannelsFromQuery';
type CommentType = GetUserCommentsQuery['users'][number]['Comments'][number];

const PAGE_LIMIT = 25;

const route = useRoute();
const { selectedChannels, hasSelectedChannels } = useSelectedChannelsFromQuery();

const username = computed(() => {
  return typeof route.params.username === 'string' ? route.params.username : '';
});

const commentsWhere = computed(() => {
  if (!hasSelectedChannels.value) {
    return undefined;
  }

  return {
    OR: [
      {
        Channel: {
          uniqueName_IN: selectedChannels.value,
        },
      },
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
    ],
  };
});

const {
  result: commentResult,
  loading,
  error,
  fetchMore,
} = useQuery(
  GET_USER_COMMENTS,
  () => ({
    username: username.value,
    limit: PAGE_LIMIT,
    offset: 0,
    where: commentsWhere.value,
  }),
  {
    fetchPolicy: 'cache-first',
    enabled: computed(() => !!username.value),
    keepPreviousResult: false,
  }
);

const commentsAggregate = computed(() => {
  return commentResult.value?.users?.[0]?.CommentsConnection?.aggregate?.count?.nodes || 0;
});

const loadMore = () => {
  const scope = JSON.stringify([username.value, commentsWhere.value]);
  if (!commentResult.value?.users?.[0]?.Comments) return;

  fetchMore({
    variables: {
      username: username.value,
      limit: PAGE_LIMIT,
      offset: commentResult.value.users[0].Comments.length,
      where: commentsWhere.value,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      const previous = previousResult.users[0];
      const next = fetchMoreResult?.users[0];
      if (scope !== JSON.stringify([username.value, commentsWhere.value]) || !previous || !next || previous.username !== username.value || next.username !== username.value) return previousResult;
      return {
        users: [
          {
            ...previous,
            Comments: [
              ...previous.Comments,
              ...next.Comments,
            ],
          },
        ],
      };
    },
  });
};

const isCommentOnDeletedEvent = (comment: CommentType) => {
  // If the comment was on a deleted discussion, the DiscussionChannel would still be there
  // because DiscussionChannels are not deleted along with the discussion, and comments
  // are attached to the DiscussionChannel. However, if a comment was on a deleted event,
  // the Event would be null, and the DiscussionChannel would be null. So this is how we
  // infer that the comment was on a deleted event.
  return comment.Event === null && comment.DiscussionChannel === null;
};
</script>

<template>
  <div class="py-3 dark:text-white">
    <div v-if="error">Error</div>
    <div
      v-else-if="
        commentResult?.users?.length === 0 ||
        commentResult?.users?.[0]?.Comments?.length === 0
      "
    >
      No comments yet
    </div>
    <div v-else-if="commentResult && commentResult?.users?.length > 0">
      <div
        v-for="comment in commentResult?.users?.[0]?.Comments"
        :key="comment.id"
        class="space-y-4"
      >
        <HydratedProfileComment v-if="!comment.archived" :comment="comment">
          <template #default="{ commentData }">
        <Comment
          :comment-data="commentData"
          :parent-comment-id="
            comment.ParentComment?.id
          "
          :depth="0"
          :show-channel="true"
          :show-context-link="true"
          :go-to-permalink-on-click="true"
        />
          </template>
        </HydratedProfileComment>
        <ArchivedCommentText
          v-if="comment?.archived"
          :channel-id="
            comment.Channel?.uniqueName ||
            comment.DiscussionChannel?.channelUniqueName ||
            comment.DiscussionChannel?.Channel?.uniqueName
          "
          :comment-id="comment.id"
        />
        <InfoBanner
          v-if="isCommentOnDeletedEvent(comment)"
          class="my-2 ml-10"
          :text="'This comment was on an event that has been deleted.'"
          type="warning"
        />
      </div>
    </div>
    <div v-if="loading">Loading...</div>
    <div v-if="(commentResult?.users?.[0]?.Comments?.length ?? 0) > 0">
      <LoadMore
        class="justify-self-center"
        :reached-end-of-results="
          commentsAggregate === commentResult?.users?.[0]?.Comments.length
        "
        @load-more="loadMore"
      />
    </div>
  </div>
</template>
