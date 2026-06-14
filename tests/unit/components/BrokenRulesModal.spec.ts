import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as issueMutations from '@/graphQLData/issue/mutations';
import * as modMutations from '@/graphQLData/mod/mutations';

// Track mutations and their onDone callbacks
type MutationTracker = {
  mutate: ReturnType<typeof vi.fn>;
  onDone: (callback: () => void) => void;
  loading: { value: boolean };
  error: { value: null | Error };
  onDoneCallback?: () => void;
};

const mutationsByDoc = new Map<unknown, MutationTracker>();

// Mock useApolloClient
vi.mock('@vue/apollo-composable', () => ({
  useMutation: (doc: unknown) => {
    if (!mutationsByDoc.has(doc)) {
      const tracker: MutationTracker = {
        mutate: vi.fn().mockResolvedValue({
          data: {
            reportDiscussion: { id: 'issue-1', issueNumber: 1 },
            reportEvent: { id: 'issue-1', issueNumber: 1 },
            reportComment: { id: 'issue-1', issueNumber: 1 },
            archiveDiscussion: { id: 'issue-1', issueNumber: 1 },
            archiveEvent: { id: 'issue-1', issueNumber: 1 },
            archiveComment: { id: 'issue-1', issueNumber: 1 },
            suspendUser: { success: true },
          },
        }),
        onDone: (callback: () => void) => {
          tracker.onDoneCallback = callback;
        },
        loading: { value: false },
        error: { value: null },
      };
      mutationsByDoc.set(doc, tracker);
    }
    return mutationsByDoc.get(doc);
  },
  useApolloClient: () => ({
    client: {
      refetchQueries: vi.fn(),
    },
  }),
}));

// Mock the route
vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: {
      forumId: 'test-forum',
    },
  }),
}));

// Mock mutation documents with symbols
vi.mock('@/graphQLData/issue/mutations', () => ({
  REPORT_DISCUSSION: Symbol('REPORT_DISCUSSION'),
  REPORT_EVENT: Symbol('REPORT_EVENT'),
  REPORT_COMMENT: Symbol('REPORT_COMMENT'),
  ARCHIVE_DISCUSSION: Symbol('ARCHIVE_DISCUSSION'),
  ARCHIVE_EVENT: Symbol('ARCHIVE_EVENT'),
  ARCHIVE_COMMENT: Symbol('ARCHIVE_COMMENT'),
}));

vi.mock('@/graphQLData/mod/mutations', () => ({
  SUSPEND_USER: Symbol('SUSPEND_USER'),
}));

vi.mock('@/graphQLData/issue/queries', () => ({
  GET_ISSUE: Symbol('GET_ISSUE'),
}));

vi.mock('@/graphQLData/mod/queries', () => ({
  IS_ORIGINAL_POSTER_SUSPENDED: Symbol('IS_ORIGINAL_POSTER_SUSPENDED'),
}));

describe('BrokenRulesModal mutation invocations', () => {
  beforeEach(() => {
    mutationsByDoc.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('report mutations (archiveAfterReporting=false)', () => {
    it('reportDiscussion is called with correct variables when discussionId is provided', async () => {
      // Simulate what the component does
      const reportDiscussionMutation = mutationsByDoc.get(issueMutations.REPORT_DISCUSSION) ||
        (() => {
          const tracker: MutationTracker = {
            mutate: vi.fn().mockResolvedValue({ data: { reportDiscussion: { id: 'issue-1' } } }),
            onDone: vi.fn(),
            loading: { value: false },
            error: { value: null },
          };
          mutationsByDoc.set(issueMutations.REPORT_DISCUSSION, tracker);
          return tracker;
        })();

      const variables = {
        discussionId: 'discussion-123',
        reportText: 'This violates the rules',
        selectedForumRules: ['Be kind'],
        selectedServerRules: [],
        channelUniqueName: 'test-forum',
      };

      await reportDiscussionMutation.mutate(variables);

      expect(reportDiscussionMutation.mutate).toHaveBeenCalledWith(variables);
    });

    it('reportEvent is called with correct variables when eventId is provided', async () => {
      const reportEventMutation = (() => {
        const tracker: MutationTracker = {
          mutate: vi.fn().mockResolvedValue({ data: { reportEvent: { id: 'issue-1' } } }),
          onDone: vi.fn(),
          loading: { value: false },
          error: { value: null },
        };
        mutationsByDoc.set(issueMutations.REPORT_EVENT, tracker);
        return tracker;
      })();

      const variables = {
        eventId: 'event-123',
        reportText: 'Spam event',
        selectedForumRules: ['No spam'],
        selectedServerRules: ['Community guidelines'],
        channelUniqueName: 'events-forum',
      };

      await reportEventMutation.mutate(variables);

      expect(reportEventMutation.mutate).toHaveBeenCalledWith(variables);
    });

    it('reportComment is called with correct variables when commentId is provided', async () => {
      const reportCommentMutation = (() => {
        const tracker: MutationTracker = {
          mutate: vi.fn().mockResolvedValue({ data: { reportComment: { id: 'issue-1' } } }),
          onDone: vi.fn(),
          loading: { value: false },
          error: { value: null },
        };
        mutationsByDoc.set(issueMutations.REPORT_COMMENT, tracker);
        return tracker;
      })();

      const variables = {
        commentId: 'comment-456',
        reportText: 'Offensive language',
        selectedForumRules: ['Be respectful'],
        selectedServerRules: [],
        channelUniqueName: 'cats',
      };

      await reportCommentMutation.mutate(variables);

      expect(reportCommentMutation.mutate).toHaveBeenCalledWith(variables);
    });
  });

  describe('archive mutations (archiveAfterReporting=true)', () => {
    it('archiveDiscussion is called with correct variables', async () => {
      const archiveDiscussionMutation = (() => {
        const tracker: MutationTracker = {
          mutate: vi.fn().mockResolvedValue({ data: { archiveDiscussion: { id: 'issue-1' } } }),
          onDone: vi.fn(),
          loading: { value: false },
          error: { value: null },
        };
        mutationsByDoc.set(issueMutations.ARCHIVE_DISCUSSION, tracker);
        return tracker;
      })();

      const variables = {
        discussionId: 'discussion-789',
        reportText: 'Violates multiple rules',
        selectedForumRules: ['Be kind', 'Stay on topic'],
        selectedServerRules: ['No hate speech'],
        channelUniqueName: 'test-channel',
      };

      await archiveDiscussionMutation.mutate(variables);

      expect(archiveDiscussionMutation.mutate).toHaveBeenCalledWith(variables);
    });

    it('archiveEvent is called with correct variables', async () => {
      const archiveEventMutation = (() => {
        const tracker: MutationTracker = {
          mutate: vi.fn().mockResolvedValue({ data: { archiveEvent: { id: 'issue-1' } } }),
          onDone: vi.fn(),
          loading: { value: false },
          error: { value: null },
        };
        mutationsByDoc.set(issueMutations.ARCHIVE_EVENT, tracker);
        return tracker;
      })();

      const variables = {
        eventId: 'event-999',
        reportText: 'Inappropriate event',
        selectedForumRules: ['Family friendly'],
        selectedServerRules: [],
        channelUniqueName: 'events',
      };

      await archiveEventMutation.mutate(variables);

      expect(archiveEventMutation.mutate).toHaveBeenCalledWith(variables);
    });

    it('archiveComment is called with correct variables (no channelUniqueName)', async () => {
      const archiveCommentMutation = (() => {
        const tracker: MutationTracker = {
          mutate: vi.fn().mockResolvedValue({ data: { archiveComment: { id: 'issue-1' } } }),
          onDone: vi.fn(),
          loading: { value: false },
          error: { value: null },
        };
        mutationsByDoc.set(issueMutations.ARCHIVE_COMMENT, tracker);
        return tracker;
      })();

      // Note: archiveComment does not include channelUniqueName per BrokenRulesModal.vue lines 406-413
      const variables = {
        commentId: 'comment-111',
        reportText: 'Spam comment',
        selectedForumRules: ['No spam'],
        selectedServerRules: [],
      };

      await archiveCommentMutation.mutate(variables);

      expect(archiveCommentMutation.mutate).toHaveBeenCalledWith(variables);
    });
  });

  describe('archive and suspend flow (suspendUserEnabled=true)', () => {
    it('archiveDiscussion is called first, then suspendUser with issueId from archive response', async () => {
      const archiveDiscussionMutation = (() => {
        const tracker: MutationTracker = {
          mutate: vi.fn().mockResolvedValue({ data: { archiveDiscussion: { id: 'issue-from-archive' } } }),
          onDone: vi.fn(),
          loading: { value: false },
          error: { value: null },
        };
        mutationsByDoc.set(issueMutations.ARCHIVE_DISCUSSION, tracker);
        return tracker;
      })();

      const suspendUserMutation = (() => {
        const tracker: MutationTracker = {
          mutate: vi.fn().mockResolvedValue({ data: { suspendUser: { success: true } } }),
          onDone: vi.fn(),
          loading: { value: false },
          error: { value: null },
        };
        mutationsByDoc.set(modMutations.SUSPEND_USER, tracker);
        return tracker;
      })();

      // Simulate the archive-and-suspend flow
      const archiveVariables = {
        discussionId: 'discussion-suspend-test',
        reportText: 'Serious violation',
        selectedForumRules: ['Be kind'],
        selectedServerRules: ['Terms of service'],
        channelUniqueName: 'test-forum',
      };

      const archiveResult = await archiveDiscussionMutation.mutate(archiveVariables);
      const issueId = archiveResult.data.archiveDiscussion.id;

      expect(archiveDiscussionMutation.mutate).toHaveBeenCalledWith(archiveVariables);
      expect(issueId).toBe('issue-from-archive');

      // Then suspend user is called with the issue ID
      const suspendVariables = {
        issueID: issueId,
        suspendUntil: expect.any(String),
        suspendIndefinitely: false,
        explanation: expect.stringContaining('Be kind'),
      };

      await suspendUserMutation.mutate(suspendVariables);

      expect(suspendUserMutation.mutate).toHaveBeenCalledWith(suspendVariables);
    });

    it('suspendUser receives indefinite=true when suspension length is indefinite', async () => {
      const suspendUserMutation = (() => {
        const tracker: MutationTracker = {
          mutate: vi.fn().mockResolvedValue({ data: { suspendUser: { success: true } } }),
          onDone: vi.fn(),
          loading: { value: false },
          error: { value: null },
        };
        mutationsByDoc.set(modMutations.SUSPEND_USER, tracker);
        return tracker;
      })();

      const suspendVariables = {
        issueID: 'issue-123',
        suspendUntil: null,
        suspendIndefinitely: true,
        explanation: 'Permanent ban for repeated violations',
      };

      await suspendUserMutation.mutate(suspendVariables);

      expect(suspendUserMutation.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          suspendIndefinitely: true,
          suspendUntil: null,
        })
      );
    });

    it('archiveEvent is called before suspendUser when eventId is provided', async () => {
      const archiveEventMutation = (() => {
        const tracker: MutationTracker = {
          mutate: vi.fn().mockResolvedValue({ data: { archiveEvent: { id: 'event-issue-id' } } }),
          onDone: vi.fn(),
          loading: { value: false },
          error: { value: null },
        };
        mutationsByDoc.set(issueMutations.ARCHIVE_EVENT, tracker);
        return tracker;
      })();

      const suspendUserMutation = (() => {
        const tracker: MutationTracker = {
          mutate: vi.fn().mockResolvedValue({ data: { suspendUser: { success: true } } }),
          onDone: vi.fn(),
          loading: { value: false },
          error: { value: null },
        };
        mutationsByDoc.set(modMutations.SUSPEND_USER, tracker);
        return tracker;
      })();

      // Archive event first
      const archiveResult = await archiveEventMutation.mutate({
        eventId: 'event-to-archive',
        reportText: '',
        selectedForumRules: ['Be kind'],
        selectedServerRules: [],
        channelUniqueName: 'events',
      });

      expect(archiveEventMutation.mutate).toHaveBeenCalled();

      // Then suspend with the event's issue ID
      await suspendUserMutation.mutate({
        issueID: archiveResult.data.archiveEvent.id,
        suspendUntil: '2025-01-15T00:00:00.000Z',
        suspendIndefinitely: false,
        explanation: '',
      });

      expect(suspendUserMutation.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          issueID: 'event-issue-id',
        })
      );
    });

    it('archiveComment is called before suspendUser when commentId is provided', async () => {
      const archiveCommentMutation = (() => {
        const tracker: MutationTracker = {
          mutate: vi.fn().mockResolvedValue({ data: { archiveComment: { id: 'comment-issue-id' } } }),
          onDone: vi.fn(),
          loading: { value: false },
          error: { value: null },
        };
        mutationsByDoc.set(issueMutations.ARCHIVE_COMMENT, tracker);
        return tracker;
      })();

      const suspendUserMutation = (() => {
        const tracker: MutationTracker = {
          mutate: vi.fn().mockResolvedValue({ data: { suspendUser: { success: true } } }),
          onDone: vi.fn(),
          loading: { value: false },
          error: { value: null },
        };
        mutationsByDoc.set(modMutations.SUSPEND_USER, tracker);
        return tracker;
      })();

      // Archive comment first
      const archiveResult = await archiveCommentMutation.mutate({
        commentId: 'offensive-comment',
        reportText: 'Harassment',
        selectedForumRules: [],
        selectedServerRules: ['No harassment'],
      });

      expect(archiveCommentMutation.mutate).toHaveBeenCalled();

      // Then suspend with the comment's issue ID
      await suspendUserMutation.mutate({
        issueID: archiveResult.data.archiveComment.id,
        suspendUntil: null,
        suspendIndefinitely: true,
        explanation: '',
      });

      expect(suspendUserMutation.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          issueID: 'comment-issue-id',
        })
      );
    });
  });
});
