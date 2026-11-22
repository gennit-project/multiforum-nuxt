import type { GetModContributionsQuery } from '@/__generated__/operations';
import type { NullableSelection } from '@/types/Comment';
import {
  getDiscussionCommentRoute,
  getDiscussionRoute,
  getDiscussionSegment,
  getEventCommentRoute,
  getEventRoute,
  getEventSegment,
} from '@/utils/contentUrls';
type SelectedActivity = GetModContributionsQuery['getModContributions'][number]['activities'][number];

export type ModActivityLink = {
  label: string;
  to: {
    name: string;
    params: Record<string, string | number>;
  };
};

export type ModActivityLinkInput = Partial<NullableSelection<Pick<SelectedActivity, 'actionType' | 'Comment' | 'Issue' | 'RelatedDiscussion' | 'RelatedEvent' | 'RelatedComment'>>>;

const getFirst = <T>(items?: T[] | null) => {
  return Array.isArray(items) && items.length > 0 ? items[0] : null;
};

export const getModActivityLinks = (
  activity: ModActivityLinkInput
): ModActivityLink[] => {
  const links: ModActivityLink[] = [];

  if (activity.actionType === 'feedback' && activity.Comment?.id) {
    const discussionChannel = getFirst(
      activity.RelatedDiscussion?.DiscussionChannels
    );
    if (
      discussionChannel?.channelUniqueName &&
      discussionChannel?.discussionId
    ) {
      links.push({
        label: 'Feedback',
        to: {
          name: 'forums-forumId-discussions-feedback-discussionId-feedbackPermalink-feedbackId',
          params: {
            forumId: discussionChannel.channelUniqueName,
            discussionId: getDiscussionSegment({
              discussionNumber: discussionChannel.discussionNumber,
              title: activity.RelatedDiscussion?.title,
              discussionId: discussionChannel.discussionId,
            }),
            feedbackId: activity.Comment.id,
          },
        },
      });
    } else if (
      getFirst(activity.RelatedEvent?.EventChannels)?.channelUniqueName &&
      activity.RelatedEvent?.id
    ) {
      const eventChannel = getFirst(activity.RelatedEvent.EventChannels);
      links.push({
        label: 'Feedback',
        to: {
          name: 'forums-forumId-events-feedback-eventId-feedbackPermalink-feedbackId',
          params: {
            forumId: eventChannel?.channelUniqueName || '',
            eventId: getEventSegment({
              eventNumber: eventChannel?.eventNumber,
              title: activity.RelatedEvent.title,
              eventId: activity.RelatedEvent.id,
            }),
            feedbackId: activity.Comment.id,
          },
        },
      });
    } else if (
      activity.RelatedComment?.DiscussionChannel?.channelUniqueName &&
      activity.RelatedComment?.DiscussionChannel?.discussionId &&
      activity.RelatedComment?.id
    ) {
      links.push({
        label: 'Feedback',
        to: {
          name: 'forums-forumId-discussions-commentFeedback-discussionId-commentId-feedbackPermalink-feedbackId',
          params: {
            forumId:
              activity.RelatedComment.DiscussionChannel.channelUniqueName,
            discussionId: getDiscussionSegment({
              discussionNumber:
                activity.RelatedComment.DiscussionChannel.discussionNumber,
              discussionId:
                activity.RelatedComment.DiscussionChannel.discussionId,
            }),
            commentId: activity.RelatedComment.id,
            feedbackId: activity.Comment.id,
          },
        },
      });
    }
  }

  if (activity.Issue?.channelUniqueName && activity.Issue.issueNumber != null) {
    links.push({
      label: 'Issue',
      to: {
        name: 'forums-forumId-issues-issueNumber',
        params: {
          forumId: activity.Issue.channelUniqueName,
          issueNumber: activity.Issue.issueNumber,
        },
      },
    });
  }

  const discussionChannel = getFirst(
    activity.RelatedDiscussion?.DiscussionChannels
  );
  if (discussionChannel?.channelUniqueName && discussionChannel?.discussionId) {
    links.push({
      label: 'Discussion',
      to: getDiscussionRoute({
        forumId: discussionChannel.channelUniqueName,
        discussionNumber: discussionChannel.discussionNumber,
        title: activity.RelatedDiscussion?.title,
        discussionId: discussionChannel.discussionId,
      }),
    });
  }

  const eventChannel = getFirst(activity.RelatedEvent?.EventChannels);
  if (eventChannel?.channelUniqueName && eventChannel?.eventId) {
    links.push({
      label: 'Event',
      to: getEventRoute({
        forumId: eventChannel.channelUniqueName,
        eventNumber: eventChannel.eventNumber,
        title: activity.RelatedEvent?.title,
        eventId: eventChannel.eventId,
      }),
    });
  }

  if (
    activity.RelatedComment?.DiscussionChannel?.channelUniqueName &&
    activity.RelatedComment?.DiscussionChannel?.discussionId &&
    activity.RelatedComment?.id
  ) {
    links.push({
      label: 'Comment',
      to: getDiscussionCommentRoute({
        forumId: activity.RelatedComment.DiscussionChannel.channelUniqueName,
        discussionNumber:
          activity.RelatedComment.DiscussionChannel.discussionNumber,
        discussionId: activity.RelatedComment.DiscussionChannel.discussionId,
        shortId: activity.RelatedComment.shortId,
        commentId: activity.RelatedComment.id,
      }),
    });
  } else if (
    getFirst(activity.RelatedComment?.Event?.EventChannels)
      ?.channelUniqueName &&
    activity.RelatedComment?.Event?.id &&
    activity.RelatedComment?.id
  ) {
    const relatedEventChannel = getFirst(
      activity.RelatedComment?.Event?.EventChannels
    );
    links.push({
      label: 'Comment',
      to: getEventCommentRoute({
        forumId: relatedEventChannel?.channelUniqueName || '',
        eventNumber: relatedEventChannel?.eventNumber,
        title: activity.RelatedComment.Event.title,
        eventId: activity.RelatedComment.Event.id,
        shortId: activity.RelatedComment.shortId,
        commentId: activity.RelatedComment.id,
      }),
    });
  } else if (
    activity.RelatedComment?.Event?.id &&
    activity.Issue?.channelUniqueName &&
    activity.RelatedComment?.id
  ) {
    links.push({
      label: 'Comment',
      to: getEventCommentRoute({
        forumId: activity.Issue.channelUniqueName,
        eventNumber: null,
        title: activity.RelatedComment.Event.title,
        eventId: activity.RelatedComment.Event.id,
        shortId: activity.RelatedComment.shortId,
        commentId: activity.RelatedComment.id,
      }),
    });
  }

  if (
    activity.Comment?.id &&
    activity.Issue?.channelUniqueName &&
    activity.Issue.issueNumber != null
  ) {
    links.push({
      label: 'Issue Comment',
      to: {
        name: 'forums-forumId-issues-issueNumber-comments-commentId',
        params: {
          forumId: activity.Issue.channelUniqueName,
          issueNumber: activity.Issue.issueNumber,
          commentId: activity.Comment.id,
        },
      },
    });
  }

  return links;
};
