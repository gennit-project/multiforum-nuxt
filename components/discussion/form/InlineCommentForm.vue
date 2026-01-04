<script lang="ts" setup>
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import type {
  Comment,
  DiscussionChannel,
  CommentCreateInput,
} from '@/__generated__/graphql';
import type { ApolloCache, FetchResult } from '@apollo/client/core';
import { CREATE_COMMENT } from '@/graphQLData/comment/mutations';
import { GET_DISCUSSION_COMMENTS } from '@/graphQLData/comment/queries';
import { GET_USER } from '@/graphQLData/user/queries';
import { usernameVar } from '@/cache';
import { getSortFromQuery } from '@/components/comments/getSortFromQuery';
import { useRoute } from 'nuxt/app';
import { gql } from '@apollo/client/core';
import ErrorBanner from '@/components/ErrorBanner.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { MAX_CHARS_IN_COMMENT } from '@/utils/constants';

const COMMENT_LIMIT = 50;

const props = defineProps({
  discussionChannel: {
    type: Object as PropType<DiscussionChannel>,
    required: true,
  },
  previousOffset: {
    type: Number,
    required: false,
    default: 0,
  },
  modName: {
    type: String,
    required: false,
    default: '',
  },
});

const route = useRoute();

// Query for user data to get notification preferences
const { result: getUserResult } = useQuery(
  GET_USER,
  {
    username: usernameVar.value,
  },
  {
    enabled: !!usernameVar.value,
  }
);

const notifyOnReplyToCommentByDefault = computed(() => {
  return (
    getUserResult.value?.users[0]?.notifyOnReplyToCommentByDefault ?? false
  );
});

const createFormValues = ref({
  text: '',
  isRootComment: true,
  depth: 1,
});

const createCommentInput = computed((): CommentCreateInput[] => {
  const input: CommentCreateInput = {
    isRootComment: true,
    isFeedbackComment: false,
    text: createFormValues.value.text || '',
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
      connect: [
        {
          where: {
            node: {
              username: usernameVar.value,
            },
          },
        },
      ],
    },
  };

  if (notifyOnReplyToCommentByDefault.value) {
    input.SubscribedToNotifications = {
      connect: [
        {
          where: {
            node: { username: usernameVar.value },
          },
        },
      ],
    };
  }

  return [input];
});

const createCommentLoading = ref(false);
const showSavedNotice = ref(false);
let savedNoticeTimeout: ReturnType<typeof setTimeout> | null = null;

const {
  mutate: createComment,
  error: createCommentError,
  onDone,
} = useMutation(CREATE_COMMENT, () => ({
  errorPolicy: 'none',
  variables: {
    createCommentInput: createCommentInput.value,
  },
  update: (cache: ApolloCache<any>, result: FetchResult) => {
    try {
      const newComment: Comment = result.data?.createComments?.comments[0];
      if (!newComment) {
        console.error('No new comment returned from createComments mutation');
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
        `,
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
        variables: commentSectionQueryVariables,
      }) as { getCommentSection: any } | null;

      if (queryResult?.getCommentSection) {
        // Update the Comments array within getCommentSection
        cache.writeQuery({
          query: GET_DISCUSSION_COMMENTS,
          variables: commentSectionQueryVariables,
          data: {
            ...queryResult,
            getCommentSection: {
              ...queryResult.getCommentSection,
              Comments: [newComment, ...queryResult.getCommentSection.Comments],
            },
          },
        });
      } else {
        console.warn(
          'Could not read query result from cache, falling back to direct modification'
        );

        // Fallback: try to modify the ROOT_QUERY directly
        const queryId = cache.identify({
          __typename: 'Query',
        });

        cache.modify({
          id: queryId,
          fields: {
            getCommentSection(existingSection = {}, { readField }) {
              if (!existingSection) return existingSection;

              const existingComments =
                (readField('Comments', existingSection) as any[]) || [];
              return {
                ...existingSection,
                Comments: [commentRef, ...existingComments],
              };
            },
          },
        });
      }

      if (props.discussionChannel?.id) {
        cache.modify({
          id: cache.identify({
            __typename: 'DiscussionChannel',
            id: props.discussionChannel.id,
          }),
          fields: {
            CommentsAggregate(existing = {}) {
              return {
                ...existing,
                count: (existing.count || 0) + 1,
              };
            },
          },
        });
      }
    } catch (error) {
      console.error('Error updating cache after creating comment:', error);
    }
  },
}));

onDone((result) => {
  createCommentLoading.value = false;
  if (result?.errors?.length) {
    return;
  }
  showSavedNotice.value = true;
  if (savedNoticeTimeout) {
    clearTimeout(savedNoticeTimeout);
  }
  savedNoticeTimeout = setTimeout(() => {
    showSavedNotice.value = false;
  }, 2000);
  createFormValues.value.text = '';
});

const handleCreateComment = async () => {
  if (!props.discussionChannel) {
    console.warn('Could not create comment: no discussion channel');
    return;
  }
  if (!usernameVar.value) {
    console.warn('Could not create comment: no username');
    return;
  }
  createCommentLoading.value = true;
  createComment();
};

const handleUpdateComment = (value: string) => {
  createFormValues.value.text = value;
};
</script>

<template>
  <div class="mb-3 w-full">
    <ErrorBanner
      v-if="createCommentError"
      :text="createCommentError?.message"
    />
    <RequireAuth :justify-left="true" :full-width="true">
      <template #has-auth>
        <form
          class="flex w-full items-center gap-3 rounded-lg border border-orange-400 bg-white px-3 py-2 dark:bg-gray-900"
          @submit.prevent="handleCreateComment"
        >
          <textarea
            data-testid="discussion-inline-comment"
            class="bg-transparent min-h-[44px] flex-1 resize-none text-sm text-gray-900 placeholder-gray-500 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none dark:text-gray-100 dark:placeholder-gray-400"
            name="discussionInlineComment"
            :rows="1"
            placeholder="Join the discussion..."
            :value="createFormValues.text"
            :maxlength="MAX_CHARS_IN_COMMENT"
            @input="
              handleUpdateComment(($event.target as HTMLTextAreaElement).value)
            "
          />
          <button
            type="submit"
            class="font-semibold flex items-center justify-center rounded-md bg-orange-400 px-4 py-2 text-sm text-black hover:bg-orange-500 focus:outline-none focus:ring-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-orange-200 dark:disabled:bg-orange-950 dark:disabled:text-orange-400"
            :disabled="
              createCommentLoading ||
              !createFormValues.text.length ||
              createFormValues.text.length > MAX_CHARS_IN_COMMENT
            "
          >
            <LoadingSpinner v-if="createCommentLoading" class="mr-2" />
            {{
              createCommentLoading
                ? 'Saving'
                : showSavedNotice
                  ? 'Saved!'
                  : 'Post'
            }}
          </button>
        </form>
      </template>
      <template #does-not-have-auth>
        <div
          class="flex w-full items-center gap-3 rounded-lg border border-orange-400 bg-white px-3 py-2 dark:bg-gray-900"
        >
          <textarea
            class="bg-transparent min-h-[44px] flex-1 resize-none text-sm text-gray-500 placeholder-gray-500 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none dark:text-gray-400 dark:placeholder-gray-500"
            name="discussionInlineComment"
            :rows="1"
            placeholder="Join the discussion..."
            disabled
          />
          <button
            type="button"
            class="font-semibold rounded-md bg-orange-200 px-4 py-2 text-sm text-black dark:bg-orange-950 dark:text-orange-400"
            disabled
          >
            Post
          </button>
        </div>
      </template>
    </RequireAuth>
  </div>
</template>
