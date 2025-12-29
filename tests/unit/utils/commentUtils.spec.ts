import { describe, it, expect } from 'vitest';
import {
  getCommentPermalink,
  getCommentContextPermalink,
  getCommentContextTitle,
  getCommentContextType,
  getCommentAuthorInfo,
} from '@/utils/commentUtils';

describe('commentUtils', () => {
  describe('getCommentPermalink', () => {
    describe('discussion comments', () => {
      it('returns permalink for regular discussion comment', () => {
        const comment = {
          id: 'comment-123',
          DiscussionChannel: {
            channelUniqueName: 'test-forum',
            discussionId: 'discussion-456',
            Discussion: {
              hasDownload: false,
            },
          },
        };

        const result = getCommentPermalink(comment);

        expect(result).toEqual({
          name: 'forums-forumId-discussions-discussionId-comments-commentId',
          params: {
            forumId: 'test-forum',
            discussionId: 'discussion-456',
            commentId: 'comment-123',
          },
        });
      });

      it('returns download permalink for comment on a download', () => {
        const comment = {
          id: 'comment-789',
          DiscussionChannel: {
            channelUniqueName: 'downloads-forum',
            discussionId: 'download-001',
            Discussion: {
              hasDownload: true,
            },
          },
        };

        const result = getCommentPermalink(comment);

        expect(result).toEqual({
          name: 'forums-forumId-downloads-discussionId-comments-commentId',
          params: {
            forumId: 'downloads-forum',
            discussionId: 'download-001',
            commentId: 'comment-789',
          },
        });
      });

      it('handles missing Discussion object (treats as regular discussion)', () => {
        const comment = {
          id: 'comment-abc',
          DiscussionChannel: {
            channelUniqueName: 'forum-x',
            discussionId: 'disc-y',
            // Discussion is undefined
          },
        };

        const result = getCommentPermalink(comment);

        expect(result).toEqual({
          name: 'forums-forumId-discussions-discussionId-comments-commentId',
          params: {
            forumId: 'forum-x',
            discussionId: 'disc-y',
            commentId: 'comment-abc',
          },
        });
      });
    });

    describe('channel comments', () => {
      it('returns permalink for channel-level comment', () => {
        const comment = {
          id: 'channel-comment-1',
          Channel: {
            uniqueName: 'my-channel',
          },
        };

        const result = getCommentPermalink(comment);

        expect(result).toEqual({
          name: 'forums-forumId-comments-commentId',
          params: {
            forumId: 'my-channel',
            commentId: 'channel-comment-1',
          },
        });
      });
    });

    describe('event comments', () => {
      it('returns permalink for event comment', () => {
        const comment = {
          id: 'event-comment-1',
          Event: {
            id: 'event-100',
            EventChannels: [{ channelUniqueName: 'event-forum' }],
          },
        };

        const result = getCommentPermalink(comment);

        expect(result).toEqual({
          name: 'forums-forumId-events-eventId-comments-commentId',
          params: {
            forumId: 'event-forum',
            eventId: 'event-100',
            commentId: 'event-comment-1',
          },
        });
      });

      it('handles event with no EventChannels', () => {
        const comment = {
          id: 'orphan-event-comment',
          Event: {
            id: 'event-orphan',
            EventChannels: [],
          },
        };

        const result = getCommentPermalink(comment);

        expect(result).toEqual({
          name: 'forums-forumId-events-eventId-comments-commentId',
          params: {
            forumId: '',
            eventId: 'event-orphan',
            commentId: 'orphan-event-comment',
          },
        });
      });

      it('handles event with undefined EventChannels', () => {
        const comment = {
          id: 'orphan-event-comment-2',
          Event: {
            id: 'event-orphan-2',
          },
        };

        const result = getCommentPermalink(comment);

        expect(result).toEqual({
          name: 'forums-forumId-events-eventId-comments-commentId',
          params: {
            forumId: '',
            eventId: 'event-orphan-2',
            commentId: 'orphan-event-comment-2',
          },
        });
      });
    });

    describe('fallback', () => {
      it('returns index fallback when comment has no context', () => {
        const comment = { id: 'orphan-comment' };

        const result = getCommentPermalink(comment);

        expect(result).toEqual({ name: 'index' });
      });

      it('returns index fallback for empty object', () => {
        const comment = {};

        const result = getCommentPermalink(comment);

        expect(result).toEqual({ name: 'index' });
      });
    });
  });

  describe('getCommentContextPermalink', () => {
    describe('discussion context', () => {
      it('returns discussion permalink for regular discussion', () => {
        const comment = {
          id: 'comment-1',
          DiscussionChannel: {
            channelUniqueName: 'forum-a',
            discussionId: 'discussion-b',
            Discussion: {
              hasDownload: false,
            },
          },
        };

        const result = getCommentContextPermalink(comment);

        expect(result).toEqual({
          name: 'forums-forumId-discussions-discussionId',
          params: {
            forumId: 'forum-a',
            discussionId: 'discussion-b',
          },
        });
      });

      it('returns download permalink for download context', () => {
        const comment = {
          id: 'comment-2',
          DiscussionChannel: {
            channelUniqueName: 'download-forum',
            discussionId: 'download-item',
            Discussion: {
              hasDownload: true,
            },
          },
        };

        const result = getCommentContextPermalink(comment);

        expect(result).toEqual({
          name: 'forums-forumId-downloads-discussionId',
          params: {
            forumId: 'download-forum',
            discussionId: 'download-item',
          },
        });
      });
    });

    describe('channel context', () => {
      it('returns channel permalink for channel-level comment', () => {
        const comment = {
          id: 'channel-comment',
          Channel: {
            uniqueName: 'the-channel',
          },
        };

        const result = getCommentContextPermalink(comment);

        expect(result).toEqual({
          name: 'forums-forumId',
          params: {
            forumId: 'the-channel',
          },
        });
      });
    });

    describe('event context', () => {
      it('returns event permalink for event comment', () => {
        const comment = {
          id: 'event-comment',
          Event: {
            id: 'event-xyz',
            EventChannels: [{ channelUniqueName: 'events-forum' }],
          },
        };

        const result = getCommentContextPermalink(comment);

        expect(result).toEqual({
          name: 'forums-forumId-events-eventId',
          params: {
            forumId: 'events-forum',
            eventId: 'event-xyz',
          },
        });
      });

      it('handles missing EventChannels gracefully', () => {
        const comment = {
          id: 'event-comment-no-channel',
          Event: {
            id: 'event-no-channel',
          },
        };

        const result = getCommentContextPermalink(comment);

        expect(result).toEqual({
          name: 'forums-forumId-events-eventId',
          params: {
            forumId: '',
            eventId: 'event-no-channel',
          },
        });
      });
    });

    describe('fallback', () => {
      it('returns index fallback when no context exists', () => {
        const comment = { id: 'no-context' };

        const result = getCommentContextPermalink(comment);

        expect(result).toEqual({ name: 'index' });
      });
    });
  });

  describe('getCommentContextTitle', () => {
    it('returns discussion title when available', () => {
      const comment = {
        DiscussionChannel: {
          Discussion: {
            title: 'My Discussion Title',
          },
        },
      };

      expect(getCommentContextTitle(comment)).toBe('My Discussion Title');
    });

    it('returns channel displayName when available', () => {
      const comment = {
        Channel: {
          displayName: 'My Channel Display Name',
          uniqueName: 'my-channel',
        },
      };

      expect(getCommentContextTitle(comment)).toBe('My Channel Display Name');
    });

    it('returns channel uniqueName when displayName is not available', () => {
      const comment = {
        Channel: {
          uniqueName: 'channel-unique-name',
        },
      };

      expect(getCommentContextTitle(comment)).toBe('channel-unique-name');
    });

    it('returns event title when available', () => {
      const comment = {
        Event: {
          title: 'My Event Title',
        },
      };

      expect(getCommentContextTitle(comment)).toBe('My Event Title');
    });

    it('returns Unknown when no context title found', () => {
      const comment = { id: 'orphan' };

      expect(getCommentContextTitle(comment)).toBe('Unknown');
    });

    it('returns Unknown when DiscussionChannel exists but has no Discussion', () => {
      const comment = {
        DiscussionChannel: {
          channelUniqueName: 'forum',
          discussionId: 'disc-id',
        },
      };

      expect(getCommentContextTitle(comment)).toBe('Unknown');
    });

    it('returns Unknown when Discussion exists but has no title', () => {
      const comment = {
        DiscussionChannel: {
          Discussion: {},
        },
      };

      expect(getCommentContextTitle(comment)).toBe('Unknown');
    });

    it('prioritizes discussion title over channel', () => {
      const comment = {
        DiscussionChannel: {
          Discussion: {
            title: 'Discussion Wins',
          },
        },
        Channel: {
          displayName: 'Channel Should Lose',
        },
      };

      expect(getCommentContextTitle(comment)).toBe('Discussion Wins');
    });

    it('prioritizes channel over event', () => {
      const comment = {
        Channel: {
          displayName: 'Channel Wins',
        },
        Event: {
          title: 'Event Should Lose',
        },
      };

      expect(getCommentContextTitle(comment)).toBe('Channel Wins');
    });
  });

  describe('getCommentContextType', () => {
    it('returns Discussion for regular discussion', () => {
      const comment = {
        DiscussionChannel: {
          Discussion: {
            hasDownload: false,
          },
        },
      };

      expect(getCommentContextType(comment)).toBe('Discussion');
    });

    it('returns Download for download discussion', () => {
      const comment = {
        DiscussionChannel: {
          Discussion: {
            hasDownload: true,
          },
        },
      };

      expect(getCommentContextType(comment)).toBe('Download');
    });

    it('returns Discussion when Discussion object is missing', () => {
      const comment = {
        DiscussionChannel: {},
      };

      expect(getCommentContextType(comment)).toBe('Discussion');
    });

    it('returns Forum for channel comment', () => {
      const comment = {
        Channel: {
          uniqueName: 'test-channel',
        },
      };

      expect(getCommentContextType(comment)).toBe('Forum');
    });

    it('returns Event for event comment', () => {
      const comment = {
        Event: {
          id: 'event-id',
        },
      };

      expect(getCommentContextType(comment)).toBe('Event');
    });

    it('returns Unknown for orphan comment', () => {
      const comment = { id: 'orphan' };

      expect(getCommentContextType(comment)).toBe('Unknown');
    });

    it('prioritizes DiscussionChannel over Channel', () => {
      const comment = {
        DiscussionChannel: {
          Discussion: {
            hasDownload: true,
          },
        },
        Channel: {
          uniqueName: 'should-be-ignored',
        },
      };

      expect(getCommentContextType(comment)).toBe('Download');
    });

    it('prioritizes Channel over Event', () => {
      const comment = {
        Channel: {
          uniqueName: 'channel-wins',
        },
        Event: {
          id: 'event-should-lose',
        },
      };

      expect(getCommentContextType(comment)).toBe('Forum');
    });
  });

  describe('getCommentAuthorInfo', () => {
    describe('User author type', () => {
      it('returns full user info for User author', () => {
        const comment = {
          CommentAuthor: {
            __typename: 'User',
            username: 'testuser',
            displayName: 'Test User',
            profilePicURL: 'https://example.com/pic.jpg',
            commentKarma: 100,
            discussionKarma: 50,
            createdAt: '2024-01-01T00:00:00Z',
            ServerRoles: [{ showAdminTag: true }],
          },
        };

        const result = getCommentAuthorInfo(comment);

        expect(result).toEqual({
          username: 'testuser',
          displayName: 'Test User',
          profilePicURL: 'https://example.com/pic.jpg',
          commentKarma: 100,
          discussionKarma: 50,
          createdAt: '2024-01-01T00:00:00Z',
          isAdmin: true,
          isModerationProfile: false,
        });
      });

      it('handles missing optional User fields with defaults', () => {
        const comment = {
          CommentAuthor: {
            __typename: 'User',
          },
        };

        const result = getCommentAuthorInfo(comment);

        expect(result).toEqual({
          username: '',
          displayName: '',
          profilePicURL: '',
          commentKarma: 0,
          discussionKarma: 0,
          createdAt: '',
          isAdmin: false,
          isModerationProfile: false,
        });
      });

      it('handles empty ServerRoles array', () => {
        const comment = {
          CommentAuthor: {
            __typename: 'User',
            username: 'user-no-roles',
            ServerRoles: [],
          },
        };

        const result = getCommentAuthorInfo(comment);

        expect(result?.isAdmin).toBe(false);
      });

      it('handles ServerRoles with showAdminTag false', () => {
        const comment = {
          CommentAuthor: {
            __typename: 'User',
            username: 'regular-user',
            ServerRoles: [{ showAdminTag: false }],
          },
        };

        const result = getCommentAuthorInfo(comment);

        expect(result?.isAdmin).toBe(false);
      });

      it('handles zero karma values correctly', () => {
        const comment = {
          CommentAuthor: {
            __typename: 'User',
            username: 'zero-karma-user',
            commentKarma: 0,
            discussionKarma: 0,
          },
        };

        const result = getCommentAuthorInfo(comment);

        expect(result?.commentKarma).toBe(0);
        expect(result?.discussionKarma).toBe(0);
      });
    });

    describe('ModerationProfile author type', () => {
      it('returns moderation profile info for ModerationProfile author', () => {
        const comment = {
          CommentAuthor: {
            __typename: 'ModerationProfile',
            displayName: 'Mod Team',
          },
        };

        const result = getCommentAuthorInfo(comment);

        expect(result).toEqual({
          displayName: 'Mod Team',
          isModerationProfile: true,
          username: '',
          profilePicURL: '',
          commentKarma: 0,
          discussionKarma: 0,
          createdAt: '',
          isAdmin: false,
        });
      });

      it('handles missing displayName for ModerationProfile', () => {
        const comment = {
          CommentAuthor: {
            __typename: 'ModerationProfile',
          },
        };

        const result = getCommentAuthorInfo(comment);

        expect(result?.displayName).toBe('');
        expect(result?.isModerationProfile).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('returns null when CommentAuthor is missing', () => {
        const comment = { id: 'no-author' };

        const result = getCommentAuthorInfo(comment);

        expect(result).toBeNull();
      });

      it('returns null when CommentAuthor is null', () => {
        const comment = { CommentAuthor: null };

        const result = getCommentAuthorInfo(comment);

        expect(result).toBeNull();
      });

      it('returns null when CommentAuthor is undefined', () => {
        const comment = { CommentAuthor: undefined };

        const result = getCommentAuthorInfo(comment);

        expect(result).toBeNull();
      });

      it('returns null for unknown author type', () => {
        const comment = {
          CommentAuthor: {
            __typename: 'UnknownType',
            name: 'Unknown Author',
          },
        };

        const result = getCommentAuthorInfo(comment);

        expect(result).toBeNull();
      });

      it('returns null when comment itself is null', () => {
        const result = getCommentAuthorInfo(null);

        expect(result).toBeNull();
      });

      it('returns null when comment itself is undefined', () => {
        const result = getCommentAuthorInfo(undefined);

        expect(result).toBeNull();
      });
    });
  });
});
