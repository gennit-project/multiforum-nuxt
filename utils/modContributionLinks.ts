type IssueInfo = {
  channelUniqueName?: string;
  issueNumber?: number | null;
};

type DiscussionChannelInfo = {
  channelUniqueName?: string;
  discussionId?: string;
};

type EventChannelInfo = {
  channelUniqueName?: string;
  eventId?: string;
};

type DiscussionInfo = {
  DiscussionChannels?: DiscussionChannelInfo[];
};

type EventInfo = {
  id?: string;
  EventChannels?: EventChannelInfo[];
};

type CommentInfo = {
  id?: string;
  DiscussionChannel?: DiscussionChannelInfo | null;
  Event?: EventInfo | null;
};

export type ModActivityLink = {
  label: string;
  to: {
    name: string;
    params: Record<string, string | number>;
  };
};

export type ModActivityLinkInput = {
  actionType?: string | null;
  Comment?: CommentInfo | null;
  Issue?: IssueInfo | null;
  RelatedDiscussion?: DiscussionInfo | null;
  RelatedEvent?: EventInfo | null;
  RelatedComment?: CommentInfo | null;
};

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
            discussionId: discussionChannel.discussionId,
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
            eventId: activity.RelatedEvent.id,
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
            discussionId:
              activity.RelatedComment.DiscussionChannel.discussionId,
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
      to: {
        name: 'forums-forumId-discussions-discussionId',
        params: {
          forumId: discussionChannel.channelUniqueName,
          discussionId: discussionChannel.discussionId,
        },
      },
    });
  }

  const eventChannel = getFirst(activity.RelatedEvent?.EventChannels);
  if (eventChannel?.channelUniqueName && eventChannel?.eventId) {
    links.push({
      label: 'Event',
      to: {
        name: 'forums-forumId-events-eventId',
        params: {
          forumId: eventChannel.channelUniqueName,
          eventId: eventChannel.eventId,
        },
      },
    });
  }

  if (
    activity.RelatedComment?.DiscussionChannel?.channelUniqueName &&
    activity.RelatedComment?.DiscussionChannel?.discussionId &&
    activity.RelatedComment?.id
  ) {
    links.push({
      label: 'Comment',
      to: {
        name: 'forums-forumId-discussions-discussionId-comments-commentId',
        params: {
          forumId: activity.RelatedComment.DiscussionChannel.channelUniqueName,
          discussionId: activity.RelatedComment.DiscussionChannel.discussionId,
          commentId: activity.RelatedComment.id,
        },
      },
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
      to: {
        name: 'forums-forumId-events-eventId-comments-commentId',
        params: {
          forumId: relatedEventChannel?.channelUniqueName || '',
          eventId: activity.RelatedComment.Event.id,
          commentId: activity.RelatedComment.id,
        },
      },
    });
  } else if (
    activity.RelatedComment?.Event?.id &&
    activity.Issue?.channelUniqueName &&
    activity.RelatedComment?.id
  ) {
    links.push({
      label: 'Comment',
      to: {
        name: 'forums-forumId-events-eventId-comments-commentId',
        params: {
          forumId: activity.Issue.channelUniqueName,
          eventId: activity.RelatedComment.Event.id,
          commentId: activity.RelatedComment.id,
        },
      },
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
