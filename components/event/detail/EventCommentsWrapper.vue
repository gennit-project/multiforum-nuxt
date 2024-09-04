<script lang="ts">
// The CommentSection component has all the comment related
// logic that can be reused for both event comments and
// event comments.

// The purpose of this component is to separate out the event
// specific logic from the logic that can be reused in the
// context of an event's comments.
import type { PropType} from "vue";
import { defineComponent, computed, ref } from "vue";
import type {
  Event,
  CommentCreateInput,
  Comment as CommentType,
} from "@/__generated__/graphql";
import { COMMENT_LIMIT } from "@/components/event/detail/EventRootCommentFormWrapper.vue";
import { useRoute } from "vue-router";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import { useQuery } from "@vue/apollo-composable";
import type { CreateEditCommentFormValues } from "@/types/Comment";
import CommentSection from "@/components/comments/CommentSection.vue";
import { GET_EVENT_COMMENTS } from "@/graphQLData/comment/queries";
import { GET_EVENT } from "@/graphQLData/event/queries";

type CommentSectionQueryUpdateInput = {
  cache: any;
  commentToDeleteId: string;
};

export default defineComponent({
  name: "EventCommentsWrapper",
  components: {
    CommentSection,
  },
  props: {
    event: {
      // This prop is required to create a comment.
      // But I have made it optional so that content does not move around
      // on the screen while the eventChannel is loading.
      type: Object as PropType<Event>,
      required: false,
      default: () => {
        return null;
      },
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
    originalPoster: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const route = useRoute();
    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      const username = localUsernameResult.value?.username;
      if (username) {
        return username;
      }
      return "";
    });

    const eventId = computed(() => {
      return props.event?.id;
    });

    const aggregateCommentCount = computed(() => {
      return props.event?.CommentsAggregate?.count || 0;
    });

    const commentSectionQueryVariables = computed(() => {
      return {
        eventId: eventId.value,
        limit: COMMENT_LIMIT,
        offset: props.previousOffset,
        sort: getSortFromQuery(route.query),
      };
    });
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
        Event: {
          connect: {
            where: {
              node: {
                id: props.event?.id,
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
      const { cache, commentToDeleteId } = input;
      const readQueryResult = cache.readQuery({
        query: GET_EVENT_COMMENTS,
        variables: this.commentSectionQueryVariables.value,
      });

      const filteredRootComments: Comment[] = (
        readQueryResult?.getEventComments?.Comments || []
      ).filter((comment: CommentType) => comment.id !== commentToDeleteId);

      cache.writeQuery({
        query: GET_EVENT_COMMENTS,
        variables: this.commentSectionQueryVariables,
        data: {
          ...readQueryResult,
          getEventComments: {
            ...readQueryResult?.getEventComments,
            Comments: filteredRootComments,
          },
        },
      });
    },
    decrementAggregateCount(cache: any) {
      cache.modify({
        id: cache.identify({
          __typename: "Event",
          id: this.event?.id,
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
      const readEventQueryResult = cache.readQuery({
        query: GET_EVENT,
        variables: {
          id: this.event?.id,
        },
      });

      const existingEventData = readEventQueryResult?.getEvent;

      const existingCommentAggregate =
        existingEventData?.CommentsAggregate?.count || 0;

      cache.writeQuery({
        query: GET_EVENT,
        variables: {
          id: this.event?.id,
        },
        data: {
          ...readEventQueryResult,
          getEvent: {
            ...existingEventData,
            CommentsAggregate: {
              ...existingEventData?.CommentsAggregate,
              count: Math.max(0, existingCommentAggregate + 1),
            },
          },
        },
      });
    },
    decrementCommentCount(cache: any) {
      const readEventQueryResult = cache.readQuery({
        query: GET_EVENT,
        variables: {
          id: this.event?.id,
        },
      });

      const existingEventData = readEventQueryResult?.getEvent;

      const existingCommentAggregate =
        existingEventData?.CommentsAggregate?.count || 0;

      cache.writeQuery({
        query: GET_EVENT,
        variables: {
          id: this.event?.id,
        },
        data: {
          ...readEventQueryResult,
          getEvent: {
            ...existingEventData,
            CommentsAggregate: {
              ...existingEventData?.CommentsAggregate,
              count: Math.max(0, existingCommentAggregate - 1),
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
    :enable-feedback="false"
    :original-poster="originalPoster"
    :show-comment-sort-buttons="false"
    @decrement-comment-count="decrementCommentCount"
    @increment-comment-count="incrementCommentCount"
    @update-comment-section-query-result="updateCommentSectionQueryResult"
    @update-create-reply-comment-input="updateCreateReplyCommentInput"
  />
</template>
