import { describe, it, expect } from 'vitest';
import { getModActivityLinks } from './modContributionLinks';

describe('getModActivityLinks', () => {
  it('builds feedback and discussion links for feedback on discussion', () => {
    const links = getModActivityLinks({
      actionType: 'feedback',
      Comment: { id: 'fb-1' },
      RelatedDiscussion: {
        DiscussionChannels: [
          { channelUniqueName: 'phoenix', discussionId: 'disc-1' },
        ],
      },
    });

    expect(links).toEqual([
      {
        label: 'Feedback',
        to: {
          name: 'forums-forumId-discussions-feedback-discussionId-feedbackPermalink-feedbackId',
          params: {
            forumId: 'phoenix',
            discussionId: 'disc-1',
            feedbackId: 'fb-1',
          },
        },
      },
      {
        label: 'Discussion',
        to: {
          name: 'forums-forumId-discussions-discussionId',
          params: {
            forumId: 'phoenix',
            discussionId: 'disc-1',
          },
        },
      },
    ]);
  });

  it('builds feedback and event links for feedback on event', () => {
    const links = getModActivityLinks({
      actionType: 'feedback',
      Comment: { id: 'fb-2' },
      RelatedEvent: {
        id: 'event-1',
        EventChannels: [{ channelUniqueName: 'tempe', eventId: 'event-1' }],
      },
    });

    expect(links).toEqual([
      {
        label: 'Feedback',
        to: {
          name: 'forums-forumId-events-feedback-eventId-feedbackPermalink-feedbackId',
          params: {
            forumId: 'tempe',
            eventId: 'event-1',
            feedbackId: 'fb-2',
          },
        },
      },
      {
        label: 'Event',
        to: {
          name: 'forums-forumId-events-eventId',
          params: {
            forumId: 'tempe',
            eventId: 'event-1',
          },
        },
      },
    ]);
  });

  it('builds feedback and comment links for feedback on comment in discussion', () => {
    const links = getModActivityLinks({
      actionType: 'feedback',
      Comment: { id: 'fb-3' },
      RelatedComment: {
        id: 'comment-1',
        DiscussionChannel: {
          channelUniqueName: 'mesa',
          discussionId: 'disc-2',
        },
      },
    });

    expect(links).toEqual([
      {
        label: 'Feedback',
        to: {
          name: 'forums-forumId-discussions-commentFeedback-discussionId-commentId-feedbackPermalink-feedbackId',
          params: {
            forumId: 'mesa',
            discussionId: 'disc-2',
            commentId: 'comment-1',
            feedbackId: 'fb-3',
          },
        },
      },
      {
        label: 'Comment',
        to: {
          name: 'forums-forumId-discussions-discussionId-comments-commentId',
          params: {
            forumId: 'mesa',
            discussionId: 'disc-2',
            commentId: 'comment-1',
          },
        },
      },
    ]);
  });

  it('builds issue and issue comment links', () => {
    const links = getModActivityLinks({
      Issue: { channelUniqueName: 'sims', issueNumber: 12 },
      Comment: { id: 'issue-comment-1' },
    });

    expect(links).toEqual([
      {
        label: 'Issue',
        to: {
          name: 'forums-forumId-issues-issueNumber',
          params: {
            forumId: 'sims',
            issueNumber: 12,
          },
        },
      },
      {
        label: 'Issue Comment',
        to: {
          name: 'forums-forumId-issues-issueNumber-comments-commentId',
          params: {
            forumId: 'sims',
            issueNumber: 12,
            commentId: 'issue-comment-1',
          },
        },
      },
    ]);
  });

  it('builds comment link for discussion comment context', () => {
    const links = getModActivityLinks({
      RelatedComment: {
        id: 'comment-2',
        DiscussionChannel: {
          channelUniqueName: 'phoenix',
          discussionId: 'disc-3',
        },
      },
    });

    expect(links).toEqual([
      {
        label: 'Comment',
        to: {
          name: 'forums-forumId-discussions-discussionId-comments-commentId',
          params: {
            forumId: 'phoenix',
            discussionId: 'disc-3',
            commentId: 'comment-2',
          },
        },
      },
    ]);
  });

  it('builds comment link for event comment context with event channel', () => {
    const links = getModActivityLinks({
      RelatedComment: {
        id: 'comment-3',
        Event: {
          id: 'event-2',
          EventChannels: [
            { channelUniqueName: 'tucson', eventId: 'event-2' },
          ],
        },
      },
    });

    expect(links).toEqual([
      {
        label: 'Comment',
        to: {
          name: 'forums-forumId-events-eventId-comments-commentId',
          params: {
            forumId: 'tucson',
            eventId: 'event-2',
            commentId: 'comment-3',
          },
        },
      },
    ]);
  });

  it('returns empty list when required data is missing', () => {
    const links = getModActivityLinks({
      actionType: 'feedback',
      Comment: { id: 'fb-4' },
    });

    expect(links).toEqual([]);
  });
});
