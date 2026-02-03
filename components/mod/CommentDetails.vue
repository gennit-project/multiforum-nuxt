<script lang="ts" setup>
import { computed } from 'vue';
import { GET_COMMENT } from '@/graphQLData/comment/queries';
import { useQuery } from '@vue/apollo-composable';
import CommentHeader from '@/components/comments/CommentHeader.vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import ErrorBanner from '../ErrorBanner.vue';
import { useRoute } from 'nuxt/app';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import {
  getFeedbackPermalinkObject,
  getPermalinkToDiscussionComment,
  getPermalinkToEventComment,
} from '@/utils/routerUtils';
import { getOriginalPoster } from '@/utils/originalPoster';

const props = defineProps({
  commentId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits([
  'fetchedOriginalAuthorUsername',
  'fetchedOriginalModProfileName',
]);

const route = useRoute();
const channelId = computed(() => {
  if (typeof route.params.forumId === 'string') {
    return route.params.forumId;
  }
  return '';
});

const {
  result: commentResult,
  error: commentError,
  loading: commentLoading,
  onResult: onCommentResult,
} = useQuery(GET_COMMENT, {
  id: props.commentId,
});

const originalComment = computed(() => {
  if (commentLoading.value || commentError.value) {
    return null;
  }

  return commentResult.value?.comments && commentResult.value?.comments[0];
});

const botMentionForumId = computed(() => {
  return (
    originalComment.value?.DiscussionChannel?.channelUniqueName ||
    originalComment.value?.Channel?.uniqueName ||
    channelId.value ||
    ''
  );
});

onCommentResult(({ data }) => {
  if (data?.comments?.length) {
    const author = getOriginalPoster({ Comment: data.comments[0] });
    if (author.username) {
      emit('fetchedOriginalAuthorUsername', author.username);
    }
    if (author.modProfileName) {
      emit('fetchedOriginalModProfileName', author.modProfileName);
    }
  }
});

const permalinkObject = computed(() => {
  const comment = originalComment.value;
  if (!comment?.id) return {};

  // Check if this is a feedback comment (has GivesFeedbackOn* relationships)
  const isFeedbackComment =
    comment.GivesFeedbackOnComment ||
    comment.GivesFeedbackOnDiscussion ||
    comment.GivesFeedbackOnEvent;

  if (isFeedbackComment) {
    // Use feedback permalink for feedback comments
    return getFeedbackPermalinkObject({
      routeName: route.name as string,
      forumId: channelId.value,
      commentId: comment.id,
      discussionId:
        comment.GivesFeedbackOnComment?.DiscussionChannel?.discussionId,
      GivesFeedbackOnComment: comment.GivesFeedbackOnComment || undefined,
      GivesFeedbackOnDiscussion: comment.GivesFeedbackOnDiscussion || undefined,
      GivesFeedbackOnEvent: comment.GivesFeedbackOnEvent || undefined,
    });
  }

  // For regular comments, check if it's on a discussion or event
  const discussionChannel = comment.DiscussionChannel;
  const eventId = comment.Event?.id;
  const forumId =
    discussionChannel?.channelUniqueName ||
    comment.Channel?.uniqueName ||
    channelId.value;

  if (discussionChannel?.discussionId) {
    // Comment is on a discussion
    return getPermalinkToDiscussionComment({
      forumId,
      discussionId: discussionChannel.discussionId,
      commentId: comment.id,
    });
  }

  if (eventId) {
    // Comment is on an event
    return getPermalinkToEventComment({
      forumId,
      eventId,
      commentId: comment.id,
    });
  }

  // Fallback - couldn't determine context
  console.warn('Could not determine permalink context for comment', comment.id);
  return {};
});
</script>

<template>
  <div class="flex w-full flex-col space-y-4">
    <LoadingSpinner v-if="commentLoading" />
    <ErrorBanner v-else-if="commentError" :text="commentError.message" />
    <div
      v-else-if="!originalComment"
      class="bg-gray-50 rounded-lg border border-gray-300 p-4 text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
    >
      <p>Can't find the content that was reported. It may have been deleted.</p>
    </div>
    <template v-else>
      <div class="flex items-center">
        <CommentHeader
          :comment-data="originalComment"
          :is-highlighted="false"
          :parent-comment-id="originalComment?.parentCommentId"
          :show-context-link="true"
          :show-channel="false"
        />
        <nuxt-link :to="permalinkObject" class="text-orange-500 underline">
          Context
        </nuxt-link>
      </div>
      <div class="ml-2 flex flex-col gap-2 border-l pl-4">
        <MarkdownPreview
          class="-ml-2"
          :text="originalComment?.text || '[Deleted]'"
          :disable-gallery="true"
          :bot-mention-forum-id="botMentionForumId"
        />
      </div>
    </template>
  </div>
</template>
