<script lang="ts">
// The CommentSection component has all the comment related
// logic that can be reused for both discussion comments and
// event comments.

// The purpose of this component is to separate out the discussion
// specific logic from the logic that can be reused in the
// context of an event's comments.
import { defineComponent, computed, PropType, ref } from "vue";
import {
  DiscussionChannel,
  CommentCreateInput,
  Comment as CommentType,
} from "@/__generated__/graphql";
import { COMMENT_LIMIT } from "@/components/discussion/detail/DiscussionDetailContent.vue";
import { useRoute } from "vue-router";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import { GET_DISCUSSION_COMMENTS } from "@/graphQLData/comment/queries";
import { useQuery } from "@vue/apollo-composable";
import { CreateEditCommentFormValues } from "@/types/Comment";
import CommentSection from "@/components/comments/CommentSection.vue";

type CommentSectionQueryUpdateInput = {
  cache: any;
  commentToDeleteId: string;
  commentToAddFeedbackTo?: CommentType;
  newFeedbackComment?: CommentType;
};

export default defineComponent({
  name: "DiscussionCommentsWrapper",
  components: {
    CommentSection,
  },
  props: {
    discussionChannel: {
      // This prop is required to create a comment.
      // But I have made it optional so that content does not move around
      // on the screen while the discussionChannel is loading.
      type: Object as PropType<DiscussionChannel>,
      required: false,
      default: () => {
        return null;
      },
    },
    discussionAuthor: {
      type: String,
      required: true,
    },
    comments: {
      type: Array as PropType<CommentType[]>,
      required: false,
      default: () => {
        return [];
      },
    },
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
    reachedEndOfResults: {
      type: Boolean,
      required: true,
    },
    previousOffset: {
      type: Number,
      required: true,
    },
    modName: {
      type: String,
      required: false,
      default: "",
    },
  },
  setup(props) {
    const route = useRoute();
    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      let username = localUsernameResult.value?.username;
      if (username) {
        return username;
      }
      return "";
    });
    const aggregateCommentCount = computed(() => {
      if (
        props.loading &&
        props.discussionChannel?.CommentsAggregate?.count === 0
      ) {
        return 0;
      }
      return props.discussionChannel?.CommentsAggregate?.count;
    });

    const commentSectionQueryVariables = {
      discussionId: props.discussionChannel?.discussionId,
      channelUniqueName: props.discussionChannel?.channelUniqueName,
      modName: props.modName,
      limit: COMMENT_LIMIT,
      offset: props.previousOffset,
      sort: getSortFromQuery(route.query),
    };
    const createCommentDefaultValues: CreateEditCommentFormValues = {
      text: "",
      isRootComment: false,
      depth: 1,
    };

    const createFormValues = ref<CreateEditCommentFormValues>(
      createCommentDefaultValues,
    );

    const createCommentInput = computed(() => {
      const input: CommentCreateInput = {
        isRootComment: false,
        DiscussionChannel: {
          connect: {
            where: {
              node: {
                id: props.discussionChannel?.id,
              },
            },
          },
        },
        ParentComment: {
          connect: {
            where: {
              node: {
                id: createFormValues.value.parentCommentId,
              },
            },
          },
        },
        text: createFormValues.value.text || "",
        CommentAuthor: {
          User: {
            connect: {
              where: {
                node: {
                  username: username.value,
                },
              },
            },
          },
        },
        UpvotedByUsers: {
          connect: [
            {
              where: {
                node: {
                  username: username.value,
                },
              },
            },
          ],
        },
      };
      return input;
    });

    return {
      aggregateCommentCount,
      commentSectionQueryVariables,
      createCommentInput,
      createFormValues,
    };
  },
  methods: {
    updateCreateReplyCommentInput(event: CreateEditCommentFormValues) {
      this.createFormValues = event;
    },
    updateCommentSectionQueryResult(input: CommentSectionQueryUpdateInput) {
      const {
        cache,
        commentToDeleteId,
        commentToAddFeedbackTo,
        newFeedbackComment,
      } = input;

      if (commentToDeleteId) {
        cache.evict({
          id: cache.identify({ __typename: "Comment", id: commentToDeleteId }),
        });
      }

      if (commentToAddFeedbackTo) {
        const readCommentQueryResult = cache.readQuery({
          query: GET_DISCUSSION_COMMENTS,
          variables: {
            ...this.commentSectionQueryVariables,
          },
        });

        const existingComments =
          readCommentQueryResult?.getCommentSection?.Comments;

        const updatedComments = existingComments.map((comment: CommentType) => {
          if (comment.id === commentToAddFeedbackTo.id) {
            const updatedComment = {
              ...commentToAddFeedbackTo,
              FeedbackComments: [
                ...comment.FeedbackComments,
                newFeedbackComment,
              ],
            };
            return updatedComment;
          }
          return comment;
        });

        cache.writeQuery({
          query: GET_DISCUSSION_COMMENTS,
          variables: {
            ...this.commentSectionQueryVariables,
          },
          data: {
            ...readCommentQueryResult,
            getCommentSection: {
              ...readCommentQueryResult.getCommentSection,
              Comments: updatedComments,
            },
          },
        });
      }
    },
    updateAggregateCount(cache: any) {
      cache.modify({
        id: cache.identify({
          __typename: "DiscussionChannel",
          id: this.discussionChannel?.id,
        }),
        fields: {
          CommentsAggregate(existingValue: any) {
            return {
              ...existingValue,
              count: existingValue.count - 1,
            };
          },
        },
      });
    },
    incrementCommentCount(cache: any) {
      const readDiscussionChannelQueryResult = cache.readQuery({
        query: GET_DISCUSSION_COMMENTS,
        variables: {
          ...this.commentSectionQueryVariables,
        },
      });

      const existingDiscussionChannelData =
        readDiscussionChannelQueryResult?.getCommentSection?.DiscussionChannel;

      let existingCommentAggregate =
        existingDiscussionChannelData?.CommentsAggregate?.count || 0;

      cache.writeQuery({
        query: GET_DISCUSSION_COMMENTS,
        variables: {
          ...this.commentSectionQueryVariables,
        },
        data: {
          ...readDiscussionChannelQueryResult,
          getCommentSection: {
            ...readDiscussionChannelQueryResult.getCommentSection,
            DiscussionChannel: {
              ...existingDiscussionChannelData,
              CommentsAggregate: {
                ...existingDiscussionChannelData?.CommentsAggregate,
                count: existingCommentAggregate + 1,
              },
            },
          },
        },
      });
    },
    decrementCommentCount(cache: any) {
      const readDiscussionChannelQueryResult = cache.readQuery({
        query: GET_DISCUSSION_COMMENTS,
        variables: this.commentSectionQueryVariables,
      });

      const existingDiscussionChannelData =
        readDiscussionChannelQueryResult?.getCommentSection?.DiscussionChannel;

      let existingCommentAggregate =
        existingDiscussionChannelData?.CommentsAggregate?.count || 0;

      cache.writeQuery({
        query: GET_DISCUSSION_COMMENTS,
        variables: {
          ...this.commentSectionQueryVariables,
        },
        data: {
          ...readDiscussionChannelQueryResult,
          getCommentSection: {
            ...readDiscussionChannelQueryResult.getCommentSection,
            DiscussionChannel: {
              ...existingDiscussionChannelData,
              CommentsAggregate: {
                ...existingDiscussionChannelData.CommentsAggregate,
                count: Math.max(0, existingCommentAggregate - 1),
              },
            },
          },
        },
      });
    },
  },
});
</script>

<template>
  <CommentSection
    :aggregate-comment-count="aggregateCommentCount"
    :comments="comments"
    :loading="loading"
    :reached-end-of-results="reachedEndOfResults"
    :comment-section-query-variables="commentSectionQueryVariables"
    :create-form-values="createFormValues"
    :create-comment-input="createCommentInput"
    :previous-offset="previousOffset"
    :original-poster="discussionAuthor"
    @decrementCommentCount="decrementCommentCount"
    @incrementCommentCount="incrementCommentCount"
    @updateCommentSectionQueryResult="updateCommentSectionQueryResult"
    @updateCreateReplyCommentInput="updateCreateReplyCommentInput"
  />
</template>
