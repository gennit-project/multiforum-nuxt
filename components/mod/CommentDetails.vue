<script lang="ts" setup>
  import { computed } from "vue";
  import { GET_COMMENT } from "@/graphQLData/comment/queries";
  import { useQuery } from "@vue/apollo-composable";
  import CommentHeader from "@/components/comments/CommentHeader.vue";
  import MarkdownPreview from "@/components/MarkdownPreview.vue";
  import ErrorBanner from "../ErrorBanner.vue";
  import { useRoute } from "nuxt/app";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import { getFeedbackPermalinkObject } from "@/utils/routerUtils";

  const props = defineProps({
    commentId: {
      type: String,
      required: true,
    },
  });

  const emit = defineEmits(["fetchedOriginalAuthorUsername"]);

  const route = useRoute();
  const channelId = computed(() => {
    if (typeof route.params.forumId === "string") {
      return route.params.forumId;
    }
    return "";
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

  onCommentResult(({ data }) => {
    if (data?.comments?.length) {
      const originalAuthorUsername = data.comments[0].Author.username;
      if (originalAuthorUsername) {
        emit("fetchedOriginalAuthorUsername", originalAuthorUsername);
      }

      const originalAuthorModProfileName = data.comments[0].Author.modProfileName;
      if (originalAuthorModProfileName) {
        emit("fetchedOriginalAuthorUsername", originalAuthorModProfileName);
      }
    }
  });

  const permalinkObject = computed(() => {
    return getFeedbackPermalinkObject({
      routeName: route.name as string,
      forumId: channelId.value,
      commentId: originalComment.value?.id,
      // This discussionId parameter is used for permalinks to a feedback on a comment in a discussion.
      discussionId: originalComment.value?.GivesFeedbackOnComment?.DiscussionChannel?.discussionId,
      GivesFeedbackOnComment: originalComment.value?.GivesFeedbackOnComment || undefined,
      GivesFeedbackOnDiscussion: originalComment.value?.GivesFeedbackOnDiscussion || undefined,
      GivesFeedbackOnEvent: originalComment.value?.GivesFeedbackOnEvent || undefined,
    });
  });
</script>

<template>
  <div class="flex w-full flex-col space-y-4">
    <LoadingSpinner v-if="commentLoading" />
    <ErrorBanner
      v-if="commentError"
      :text="commentError.message"
    />
    <div
      v-else-if="originalComment"
      class="flex items-center"
    >
      <CommentHeader
        :comment-data="originalComment"
        :is-highlighted="false"
        :parent-comment-id="originalComment?.parentCommentId"
        :show-channel="false"
        :show-context-link="true"
      />
      <nuxt-link
        class="text-orange-500 underline"
        :to="permalinkObject"
      >
        Context
      </nuxt-link>
    </div>
    <div class="ml-2 flex flex-col gap-2 border-l pl-4">
      <MarkdownPreview
        class="-ml-2"
        :disable-gallery="true"
        :text="originalComment?.text || '[Deleted]'"
      />
    </div>
  </div>
</template>
