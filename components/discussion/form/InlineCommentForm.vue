<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
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
import SuspensionNotice from '@/components/SuspensionNotice.vue';
import { useChannelSuspensionNotice } from '@/composables/useSuspensionNotice';
import { getBotMentionState, filterBotSuggestions } from '@/utils/botMentions';

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
  botSuggestions: {
    type: Array as PropType<
      { value: string; label: string; isDeprecated?: boolean }[]
    >,
    default: () => [],
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
const submitAttempted = ref(false);
let savedNoticeTimeout: ReturnType<typeof setTimeout> | null = null;
const cursorIndex = ref(0);
const inlineTextarea = ref<HTMLTextAreaElement | null>(null);

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
  submitAttempted.value = false;
  showSavedNotice.value = true;
  if (savedNoticeTimeout) {
    clearTimeout(savedNoticeTimeout);
  }
  savedNoticeTimeout = setTimeout(() => {
    showSavedNotice.value = false;
  }, 2000);
  createFormValues.value.text = '';
});

const {
  issueNumber: suspensionIssueNumber,
  suspendedUntil: suspensionUntil,
  suspendedIndefinitely: suspensionIndefinitely,
  channelId: suspensionChannelId,
} = useChannelSuspensionNotice(
  computed(() => props.discussionChannel?.channelUniqueName || '')
);

const showSuspensionNotice = computed(() => {
  return submitAttempted.value && !!suspensionIssueNumber.value;
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
  submitAttempted.value = true;
  createCommentLoading.value = true;
  createComment();
};

const handleUpdateComment = (value: string) => {
  createFormValues.value.text = value;
};

const updateCursorIndex = (event: Event) => {
  const target = event.target as HTMLTextAreaElement | null;
  if (!target) return;
  cursorIndex.value = target.selectionStart ?? 0;
};

const mentionState = computed(() =>
  getBotMentionState(createFormValues.value.text || '', cursorIndex.value)
);
const filteredBotSuggestions = computed(() => {
  const state = mentionState.value;
  if (!state || props.botSuggestions.length === 0) return [];
  const activeSuggestions = props.botSuggestions.filter(
    (bot) => !bot.isDeprecated
  );
  return filterBotSuggestions(activeSuggestions, state.query);
});

const hasExactMatch = computed(() => {
  const query = mentionState.value?.query;
  if (!query) return false;
  return filteredBotSuggestions.value.some(
    (bot) => bot.value.toLowerCase() === query.toLowerCase()
  );
});

const showBotSuggestions = computed(
  () => filteredBotSuggestions.value.length > 0 && !hasExactMatch.value
);

const applyBotSuggestion = (value: string) => {
  const state = mentionState.value;
  const textarea = inlineTextarea.value;
  if (!state || !textarea) return;

  const before = createFormValues.value.text.slice(0, state.triggerIndex);
  const after = createFormValues.value.text.slice(cursorIndex.value);
  const insertion = `/bot/${value}`;
  const needsSpace = after.length > 0 && !after.startsWith(' ');
  const nextText = `${before}${insertion}${needsSpace ? ' ' : ''}${after}`;

  createFormValues.value.text = nextText;
  textarea.value = nextText;
  const nextCursor = before.length + insertion.length + (needsSpace ? 1 : 0);
  textarea.setSelectionRange(nextCursor, nextCursor);
  cursorIndex.value = nextCursor;
  textarea.focus();
};
</script>

<template>
  <div class="mb-3 w-full">
    <ErrorBanner
      v-if="createCommentError"
      :text="createCommentError?.message"
    />
    <SuspensionNotice
      v-if="
        showSuspensionNotice &&
        suspensionChannelId &&
        suspensionIssueNumber !== null
      "
      class="mb-2"
      :issue-number="suspensionIssueNumber!"
      :channel-id="suspensionChannelId"
      :suspended-until="suspensionUntil ?? undefined"
      :suspended-indefinitely="suspensionIndefinitely ?? false"
      :message="'You are suspended in this forum and cannot comment.'"
    />
    <RequireAuth :justify-left="true" :full-width="true">
      <template #has-auth>
        <form
          class="relative flex w-full items-center gap-3 rounded-lg border border-orange-400 bg-white px-3 py-2 dark:bg-gray-900"
          @submit.prevent="handleCreateComment"
        >
          <textarea
            ref="inlineTextarea"
            data-testid="discussion-inline-comment"
            class="bg-transparent min-h-[44px] flex-1 resize-none text-sm text-gray-900 placeholder-gray-500 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none dark:text-gray-100 dark:placeholder-gray-400"
            name="discussionInlineComment"
            :rows="1"
            placeholder="Join the discussion..."
            :value="createFormValues.text"
            :maxlength="MAX_CHARS_IN_COMMENT"
            @input="
              handleUpdateComment(($event.target as HTMLTextAreaElement).value);
              updateCursorIndex($event);
            "
            @click="updateCursorIndex"
            @keyup="updateCursorIndex"
          />
          <div
            v-if="showBotSuggestions"
            class="absolute left-0 top-full z-20 mt-1 min-w-[220px] max-w-sm rounded-md border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
          >
            <button
              v-for="suggestion in filteredBotSuggestions"
              :key="suggestion.value"
              type="button"
              class="flex w-full cursor-pointer flex-col text-left px-3 py-2 transition hover:bg-gray-100 dark:hover:bg-gray-700"
              @click.prevent="applyBotSuggestion(suggestion.value)"
            >
              <span class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ suggestion.mention }}
              </span>
              <span
                v-if="suggestion.displayName"
                class="text-xs text-gray-500 dark:text-gray-400"
              >
                {{ suggestion.displayName }}
              </span>
            </button>
          </div>
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
