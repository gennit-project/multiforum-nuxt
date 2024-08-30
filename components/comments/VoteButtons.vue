<script lang="ts">
import type { PropType} from "vue";
import { computed, defineComponent } from "vue";
import type { Comment } from "@/src/__generated__/graphql";
import Votes from "./Votes.vue";
import { useMutation, useQuery } from "@vue/apollo-composable";
import {
  GET_LOCAL_MOD_PROFILE_NAME,
  GET_LOCAL_USERNAME,
} from "@/graphQLData/user/queries";
import {
  UPVOTE_COMMENT,
  UNDO_UPVOTE_COMMENT,
} from "@/graphQLData/comment/mutations";
import ErrorBanner from "../ErrorBanner.vue";

export default defineComponent({
  name: "VoteComponent",
  components: {
    ErrorBanner,
    VotesComponent: Votes,
  },
  props: {
    commentData: {
      type: Object as PropType<Comment>,
      required: true,
    },
    showDownvote: {
      type: Boolean,
      default: true,
    },
    showUpvote: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const { result: localUsernameResult, loading: localUsernameLoading } =
      useQuery(GET_LOCAL_USERNAME);

    const {
      result: localModProfileNameResult,
      loading: localModProfileNameLoading,
      error: localModProfileNameError,
    } = useQuery(GET_LOCAL_MOD_PROFILE_NAME);

    const username = computed(() => {
      if (localUsernameLoading.value) {
        return "";
      }
      return localUsernameResult.value?.username || "";
    });

    const loggedInUserModName = computed(() => {
      if (localModProfileNameLoading.value || localModProfileNameError.value) {
        return "";
      }
      return localModProfileNameResult.value.modProfileName;
    });
    const loggedInUserUpvoted = computed(() => {
      if (
        localUsernameLoading.value ||
        !localUsernameResult.value ||
        !props.commentData.UpvotedByUsers
      ) {
        return false;
      }
      const match =
        props.commentData.UpvotedByUsers.filter((user: any) => {
          return user.username === localUsernameResult.value.username;
        }).length === 1;
      return match;
    });

    const upvoteCount = computed(() => {
      if (!props.commentData.UpvotedByUsersAggregate) {
        return 0;
      }
      return props.commentData.UpvotedByUsersAggregate.count;
    });

    const loggedInUserDownvoted = computed(() => {
      // Feedback comments are pre-filtered by the logged in author
      // just so that we can use them to indicate if the logged in user
      // has already given feedback on the comment.
      const feedbackCommentsByLoggedInUser = props.commentData.FeedbackComments;
      if (!feedbackCommentsByLoggedInUser) {
        if (typeof props.commentData.FeedbackCommentsAggregate?.count === "number" && props.commentData.FeedbackCommentsAggregate.count > 0) {
          return true;
        }
        return false;
      }
      if (feedbackCommentsByLoggedInUser.length === 0) {
        return false;
      }
      return true;
    });

    const {
      mutate: upvoteComment,
      error: upvoteCommentError,
      loading: upvoteCommentLoading,
    } = useMutation(UPVOTE_COMMENT, () => ({
      variables: {
        id: props.commentData.id,
        username: username.value,
      },
    }));

    const {
      mutate: undoUpvoteComment,
      error: undoUpvoteError,
      loading: undoUpvoteLoading,
    } = useMutation(UNDO_UPVOTE_COMMENT, () => ({
      variables: {
        id: props.commentData.id,
        username: username.value,
      },
    }));

    return {
      upvoteCommentLoading,
      undoUpvoteLoading,
      loggedInUserDownvoted,
      loggedInUserUpvoted,
      loggedInUserModName,
      upvoteComment,
      upvoteCommentError,
      undoUpvoteError,
      undoUpvoteComment,
      upvoteCount,
      username,
    };
  },
});
</script>
<template>
  <div class="flex items-center">
    <ErrorBanner
      v-if="upvoteCommentError || undoUpvoteError"
      :text="upvoteCommentError?.message || undoUpvoteError?.message"
    />
    <VotesComponent
      :show-downvote-count="false"
      :upvote-count="upvoteCount"
      :upvote-active="loggedInUserUpvoted"
      :downvote-active="loggedInUserDownvoted"
      :has-mod-profile="!!loggedInUserModName"
      :upvote-loading="upvoteCommentLoading || undoUpvoteLoading"
      :show-downvote="showDownvote"
      :show-upvote="showUpvote"
      @upvote="upvoteComment"
      @undo-upvote="undoUpvoteComment"
      @undo-downvote="$emit('clickUndoFeedback')"
      @open-mod-profile="$emit('openModProfile')"
      @edit-feedback="$emit('clickEditFeedback')"
      @undo-feedback="$emit('clickUndoFeedback')"
      @view-feedback="$emit('viewFeedback')"
      @give-feedback="$emit('clickFeedback')"
    />
  </div>
</template>
