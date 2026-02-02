import { computed, type Ref, type ComputedRef } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import type { Comment } from '@/__generated__/graphql';
import type { RouteLocationRaw } from 'vue-router';
import { getFeedbackPermalinkObject } from '@/utils/routerUtils';

type UseCommentPermalinkParams = {
  commentData: Ref<Comment> | ComputedRef<Comment>;
  forumId: Ref<string> | ComputedRef<string>;
};

type UseCommentPermalinkReturn = {
  canShowPermalink: ComputedRef<boolean>;
  isFeedbackComment: ComputedRef<boolean>;
  permalinkObject: ComputedRef<RouteLocationRaw>;
  permalink: ComputedRef<string>;
  copyLink: (onCopied?: (value: boolean) => void) => Promise<void>;
};

/**
 * Composable that handles permalink computation and copy logic for comments.
 * Determines the appropriate permalink based on comment context (discussion, event, issue, feedback).
 *
 * @param params - Object containing:
 *   - commentData: The comment data object
 *   - forumId: The forum/channel unique name
 * @returns Object with canShowPermalink, isFeedbackComment, permalinkObject, permalink, and copyLink
 */
export function useCommentPermalink(
  params: UseCommentPermalinkParams
): UseCommentPermalinkReturn {
  const { commentData, forumId } = params;
  const route = useRoute();
  const router = useRouter();

  // Extract route params
  const discussionId = computed(() => route.params.discussionId as string | undefined);
  const eventId = computed(() => route.params.eventId as string | undefined);
  const issueNumber = computed(() => route.params.issueNumber as string | undefined);

  // Check if this is a feedback comment
  const isFeedbackComment = computed(() => {
    const comment = commentData.value;
    return !!(
      comment.GivesFeedbackOnDiscussion ||
      comment.GivesFeedbackOnEvent ||
      comment.GivesFeedbackOnComment
    );
  });

  // Determine if we can show a permalink for this comment
  const canShowPermalink = computed(() => {
    const comment = commentData.value;
    const channelUniqueName =
      comment.Channel?.uniqueName ||
      comment.DiscussionChannel?.channelUniqueName;
    const hasForumContext = !!(channelUniqueName || forumId.value);

    return !!(
      comment.DiscussionChannel ||
      comment.Event ||
      comment.Issue ||
      comment.Channel ||
      (issueNumber.value && forumId.value && comment.id) ||
      (discussionId.value && forumId.value) ||
      (eventId.value && forumId.value) ||
      (hasForumContext &&
        (comment.GivesFeedbackOnDiscussion ||
          comment.GivesFeedbackOnEvent ||
          comment.GivesFeedbackOnComment))
    );
  });

  // Compute the permalink route object
  const permalinkObject = computed<RouteLocationRaw>(() => {
    if (!canShowPermalink.value) {
      return {};
    }

    const comment = commentData.value;
    const channelUniqueName =
      comment.Channel?.uniqueName ||
      comment.DiscussionChannel?.channelUniqueName;

    // If we don't have a valid forumId and we're not on a page with a forumId param,
    // we can't create a permalink
    if (!channelUniqueName && !forumId.value) {
      console.warn('Missing forumId for comment permalink', comment.id);
      return {};
    }

    // Handle feedback comment permalinks
    if (isFeedbackComment.value) {
      if (!channelUniqueName && !forumId.value) {
        return {};
      }
      return (
        getFeedbackPermalinkObject({
          routeName: route.name as string,
          forumId: channelUniqueName || (forumId.value as string),
          discussionId:
            comment.GivesFeedbackOnDiscussion?.id ||
            (discussionId.value as string) ||
            comment.DiscussionChannel?.discussionId,
          eventId:
            comment.GivesFeedbackOnEvent?.id || (eventId.value as string),
          commentId: comment.id,
          GivesFeedbackOnComment:
            comment.GivesFeedbackOnComment || undefined,
          GivesFeedbackOnDiscussion:
            comment.GivesFeedbackOnDiscussion || undefined,
          GivesFeedbackOnEvent:
            comment.GivesFeedbackOnEvent || undefined,
        }) || {}
      );
    }

    // Default comment permalink object
    let result: RouteLocationRaw = {};

    // Permalink for comment on a discussion
    const discussionIdInLink =
      discussionId.value || comment.DiscussionChannel?.discussionId;
    if (discussionIdInLink && (channelUniqueName || forumId.value)) {
      result = {
        name: 'forums-forumId-discussions-discussionId-comments-commentId',
        params: {
          discussionId: discussionIdInLink,
          commentId: comment.id,
          forumId: channelUniqueName || forumId.value,
        },
      };
    }

    // Permalink for comment on an event
    const eventIdInLink = eventId.value || comment.Event?.id;
    if (eventIdInLink && (channelUniqueName || forumId.value)) {
      result = {
        name: 'forums-forumId-events-eventId-comments-commentId',
        params: {
          eventId: comment.Event?.id,
          forumId: channelUniqueName || forumId.value,
          commentId: comment.id,
        },
      };
    }

    // Permalink for comment on an issue
    const issueNumberInLink =
      issueNumber.value || comment.Issue?.issueNumber;
    if (issueNumberInLink && channelUniqueName) {
      result = {
        name: 'forums-forumId-issues-issueNumber-comments-commentId',
        params: {
          issueNumber: issueNumberInLink,
          forumId: channelUniqueName,
          commentId: comment.id,
        },
      };
    }

    return result;
  });

  // Compute the base path for the permalink URL
  let basePath = '';
  if (import.meta.client) {
    basePath = window.location.origin;
  } else {
    basePath = process.env.BASE_URL || '';
  }

  // Compute the full permalink URL
  const permalink = computed(() => {
    if (!Object.keys(permalinkObject.value ?? {}).length) {
      return '';
    }
    return `${basePath}${router.resolve(permalinkObject.value ?? {}).href}`;
  });

  // Copy the permalink to clipboard
  const copyLink = async (onCopied?: (value: boolean) => void) => {
    if (!permalink.value) {
      console.warn('No permalink available to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(permalink.value);
      onCopied?.(true);
    } catch (e: unknown) {
      throw e instanceof Error ? e : new Error(String(e));
    }
    setTimeout(() => {
      onCopied?.(false);
    }, 2000);
  };

  return {
    canShowPermalink,
    isFeedbackComment,
    permalinkObject,
    permalink,
    copyLink,
  };
}
