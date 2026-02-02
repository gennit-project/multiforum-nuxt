import { computed, type Ref, type ComputedRef } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { gql } from '@apollo/client/core';
import type { Reference } from '@apollo/client/core';
import type { Comment } from '@/__generated__/graphql';
import {
  MARK_AS_ANSWERED_BY_COMMENT,
  UNMARK_COMMENT_AS_ANSWER,
} from '@/graphQLData/discussion/mutations';
import { usernameVar } from '@/cache';

type UseBestAnswerMutationsParams = {
  commentId: Ref<string> | ComputedRef<string>;
  forumId: Ref<string> | ComputedRef<string>;
  discussionId: Ref<string | undefined> | ComputedRef<string | undefined>;
  originalPoster: Ref<string> | ComputedRef<string>;
  answers: Ref<Comment[]> | ComputedRef<Comment[]>;
  onMarked?: () => void;
  onUnmarked?: () => void;
};

type UseBestAnswerMutationsReturn = {
  isDiscussionAuthor: ComputedRef<boolean>;
  isMarkedAsAnswer: ComputedRef<boolean>;
  handleMarkAsBestAnswer: () => Promise<void>;
  handleUnmarkAsBestAnswer: () => Promise<void>;
};

// Fragment for updating cached answer data
const UPDATED_ANSWERS_FRAGMENT = gql`
  fragment UpdatedAnswers on DiscussionChannel {
    id
    answered
    Answers {
      id
      text
      CommentAuthor {
        ... on User {
          username
        }
        ... on ModerationProfile {
          displayName
        }
      }
    }
  }
`;

/**
 * Composable that handles best answer mutations for comments.
 * Provides functions to mark/unmark comments as best answers with cache updates.
 *
 * @param params - Object containing:
 *   - commentId: The ID of the comment
 *   - forumId: The forum/channel unique name
 *   - discussionId: The discussion ID (from route or comment data)
 *   - originalPoster: Username of the discussion author
 *   - answers: Array of comments marked as answers
 *   - onMarked: Optional callback when marked as answer
 *   - onUnmarked: Optional callback when unmarked as answer
 * @returns Object with isDiscussionAuthor, isMarkedAsAnswer, and handler functions
 */
export function useBestAnswerMutations(
  params: UseBestAnswerMutationsParams
): UseBestAnswerMutationsReturn {
  const {
    commentId,
    forumId,
    discussionId,
    originalPoster,
    answers,
    onMarked,
    onUnmarked,
  } = params;

  // Mutation for marking a comment as best answer
  const { mutate: markAsAnsweredByComment } = useMutation(
    MARK_AS_ANSWERED_BY_COMMENT,
    {
      update: (cache, { data }) => {
        if (data?.updateDiscussionChannels?.discussionChannels?.[0]) {
          const updatedChannel =
            data.updateDiscussionChannels.discussionChannels[0];

          cache.modify({
            fields: {
              discussionChannels(existingChannels = [], { readField }) {
                return existingChannels.map((channelRef: Reference) => {
                  const channelId = readField('id', channelRef);
                  if (channelId === updatedChannel.id) {
                    cache.writeFragment({
                      id: cache.identify(channelRef),
                      fragment: UPDATED_ANSWERS_FRAGMENT,
                      data: updatedChannel,
                    });
                  }
                  return channelRef;
                });
              },
            },
          });
        }
      },
    }
  );

  // Mutation for unmarking a comment as best answer
  const { mutate: unmarkCommentAsAnswer } = useMutation(
    UNMARK_COMMENT_AS_ANSWER,
    {
      update: (cache, { data }) => {
        if (data?.updateDiscussionChannels?.discussionChannels?.[0]) {
          const updatedChannel =
            data.updateDiscussionChannels.discussionChannels[0];

          cache.modify({
            fields: {
              discussionChannels(existingChannels = [], { readField }) {
                return existingChannels.map((channelRef: Reference) => {
                  const channelId = readField('id', channelRef);
                  if (channelId === updatedChannel.id) {
                    cache.writeFragment({
                      id: cache.identify(channelRef),
                      fragment: UPDATED_ANSWERS_FRAGMENT,
                      data: updatedChannel,
                    });
                  }
                  return channelRef;
                });
              },
            },
          });
        }
      },
    }
  );

  // Check if the current user is the discussion author
  const isDiscussionAuthor = computed(() => {
    return originalPoster.value === usernameVar.value;
  });

  // Check if this comment is currently marked as an answer
  const isMarkedAsAnswer = computed(() => {
    const answersArray = answers.value;
    if (!answersArray || answersArray.length === 0) {
      return false;
    }
    return answersArray.some(
      (answer: Comment) => answer.id === commentId.value
    );
  });

  // Handle marking a comment as best answer
  const handleMarkAsBestAnswer = async () => {
    const discussionIdToUse = discussionId.value;

    if (!discussionIdToUse) {
      console.warn('No discussion ID found for comment');
      return;
    }

    try {
      await markAsAnsweredByComment({
        commentId: commentId.value,
        channelId: forumId.value,
        discussionId: discussionIdToUse,
      });
      onMarked?.();
    } catch (error) {
      console.error('Error marking comment as best answer:', error);
    }
  };

  // Handle unmarking a comment as best answer
  const handleUnmarkAsBestAnswer = async () => {
    const discussionIdToUse = discussionId.value;

    if (!discussionIdToUse) {
      console.warn('No discussion ID found for comment');
      return;
    }

    try {
      await unmarkCommentAsAnswer({
        commentId: commentId.value,
        channelId: forumId.value,
        discussionId: discussionIdToUse,
      });
      onUnmarked?.();
    } catch (error) {
      console.error('Error unmarking comment as best answer:', error);
    }
  };

  return {
    isDiscussionAuthor,
    isMarkedAsAnswer,
    handleMarkAsBestAnswer,
    handleUnmarkAsBestAnswer,
  };
}
