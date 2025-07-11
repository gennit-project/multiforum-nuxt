<script lang="ts" setup>
import { ref, computed } from "vue";
import type { PropType } from "vue";
import { useMutation, useQuery } from "@vue/apollo-composable";
import CreateRootCommentForm from "@/components/comments/CreateRootCommentForm.vue";
import type { Comment, DiscussionChannel } from "@/__generated__/graphql";
import type { ApolloCache, FetchResult } from "@apollo/client/core";
import { CREATE_COMMENT } from "@/graphQLData/comment/mutations";
import { GET_DISCUSSION_COMMENTS } from "@/graphQLData/comment/queries";
import { GET_USER } from "@/graphQLData/user/queries";
import { usernameVar } from "@/cache";
import { getSortFromQuery } from "@/components/comments/getSortFromQuery";
import { useRoute } from "nuxt/app";
import { gql } from "@apollo/client/core";

// Props
const props = defineProps({
  link: {
    type: String,
    default: "",
  },
  dataTestid: {
    type: String,
    default: "",
  },
  discussionChannel: {
    type: Object as PropType<DiscussionChannel>,
    required: false,
    default: () => null,
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
});

const COMMENT_LIMIT = 50;

// Setup
const route = useRoute();

// Query for user data to get notification preferences
const {
  result: getUserResult,
} = useQuery(GET_USER, {
  username: usernameVar.value,
}, {
  enabled: !!usernameVar.value,
});

// Get user's notification preference for comment replies
const notifyOnReplyToCommentByDefault = computed(() => {
  return getUserResult.value?.users[0]?.notifyOnReplyToCommentByDefault ?? false;
});

const createCommentDefaultValues = {
  text: "",
  isRootComment: true,
  depth: 1,
};

const createFormValues = ref(createCommentDefaultValues);

const createCommentInput = computed(() => {
  const input = {
    isRootComment: true,
    isFeedbackComment: false,
    text: createFormValues.value.text || "",
    CommentAuthor: {
      User: {
        connect: {
          where: {
            node: {
              username: usernameVar.value,
            },
          },
        },
      },
    },
    DiscussionChannel: {
      connect: {
        where: {
          node: {
            id: props.discussionChannel?.id,
          },
        },
      },
    },
    Channel: {
      connect: {
        where: {
          node: {
            uniqueName: props.discussionChannel?.channelUniqueName,
          },
        },
      },
    },
    UpvotedByUsers: {
      connect: {
        where: {
          node: {
            username: usernameVar.value,
          },
        },
      },
    },
  };

  // Add the logged-in user to SubscribedToNotifications if they want to be notified by default
  if (notifyOnReplyToCommentByDefault.value) {
    input.SubscribedToNotifications = {
      connect: {
        where: {
          node: { username: usernameVar.value }
        }
      }
    };
  }

  return [input];
});

const createCommentLoading = ref(false);
const commentEditorOpen = ref(false);

const {
  mutate: createComment,
  error: createCommentError,
  onDone,
} = useMutation(CREATE_COMMENT, () => ({
  errorPolicy: "none",
  variables: {
    createCommentInput: createCommentInput.value,
  },

  update: (cache: ApolloCache<any>, result: FetchResult) => {
    // This is the logic for updating the cache
    // after creating a root comment. For the logic for updating
    // the cache after replying to a comment, see the CommentSection
    // component.
    try {
      const newComment: Comment = result.data?.createComments?.comments[0];
      if (!newComment) {
        console.error("No new comment returned from createComments mutation");
        return;
      }

      // First, make sure the full comment data is written to the cache
      const commentRef = cache.writeFragment({
        data: newComment,
        fragment: gql`
          fragment NewCommentWithDetails on Comment {
            id
            text
            emoji
            weightedVotesCount
            createdAt
            updatedAt
            archived
            CommentAuthor {
              __typename
              ... on User {
                username
                profilePicURL
              }
              ... on ModerationProfile {
                displayName
              }
            }
            ChildCommentsAggregate {
              count
            }
            UpvotedByUsers {
              username
            }
            UpvotedByUsersAggregate {
              count
            }
          }
        `
      });

      // Read the current query result from the cache
      const commentSectionQueryVariables = {
        discussionId: props.discussionChannel.discussionId,
        channelUniqueName: props.discussionChannel.channelUniqueName,
        username: usernameVar.value,
        modName: props.modName,
        limit: COMMENT_LIMIT,
        offset: props.previousOffset,
        sort: getSortFromQuery(route.query),
      };

      const queryResult = cache.readQuery({
        query: GET_DISCUSSION_COMMENTS,
        variables: commentSectionQueryVariables
      });

      if (queryResult) {
        // Update the Comments array within getCommentSection
        cache.writeQuery({
          query: GET_DISCUSSION_COMMENTS,
          variables: commentSectionQueryVariables,
          data: {
            ...queryResult,
            getCommentSection: {
              ...queryResult.getCommentSection,
              Comments: [
                newComment,
                ...queryResult.getCommentSection.Comments
              ]
            }
          }
        });
      } else {
        console.warn("Could not read query result from cache, falling back to direct modification");
        
        // Fallback: try to modify the ROOT_QUERY directly
        const queryId = cache.identify({
          __typename: "Query"
        });
        
        cache.modify({
          id: queryId,
          fields: {
            getCommentSection(existingSection = {}, { readField }) {
              if (!existingSection) return existingSection;
              
              return {
                ...existingSection,
                Comments: [commentRef, ...(readField('Comments', existingSection) || [])]
              };
            }
          }
        });
      }

      // 2. Increment the comment count on the DiscussionChannel
      if (props.discussionChannel?.id) {
        cache.modify({
          id: cache.identify({
            __typename: "DiscussionChannel",
            id: props.discussionChannel.id
          }),
          fields: {
            CommentsAggregate(existing = {}) {
              return {
                ...existing,
                count: (existing.count || 0) + 1
              };
            }
          }
        });
      }
    } catch (error) {
      console.error("Error updating cache after creating comment:", error);
    }
  },
}));

onDone(() => {
  createFormValues.value = createCommentDefaultValues;
  createCommentLoading.value = false;
  commentEditorOpen.value = false;
});

const handleCreateComment = async () => {
  if (!props.discussionChannel) {
    console.warn(
      "Could not create the comment because there is no discussion channel in the create root comment form"
    );
    return;
  }
  if (!usernameVar.value) {
    console.warn(
      "Could not create the comment because there is no username in the create root comment form"
    );
    return;
  }
  createCommentLoading.value = true;
  createComment();
};

const handleUpdateComment = (event: string) => {
  createFormValues.value.text = event;
};
</script>

<template>
  <CreateRootCommentForm
    :create-form-values="createFormValues"
    :create-comment-loading="createCommentLoading"
    :create-comment-error="createCommentError"
    :comment-editor-open="commentEditorOpen"
    @open-comment-editor="commentEditorOpen = true"
    @close-comment-editor="commentEditorOpen = false"
    @handle-create-comment="handleCreateComment"
    @handle-update-comment="handleUpdateComment"
  />
</template>
