import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createAuthStateMock } from '@/tests/utils/mockAuth';
import { makeComment } from '@/tests/utils/factories';
import VotesComponent from '@/components/comments/Votes.vue';
import SuperUpvoteModal from '@/components/superUpvote/SuperUpvoteModal.vue';
import type { Comment } from '@/__generated__/graphql';

import VoteButtons from '@/components/comments/VoteButtons.vue';

// Route each vote mutation to a per-operation tracker (matched on the operation
// name in the gql source body) and capture the update callback so the
// undoSuperUpvote cache logic can be invoked directly.
type VoteTracker = { mutate: ReturnType<typeof vi.fn>; update: ((cache: unknown, res: unknown) => void) | null };
const voteOps = new Map<string, VoteTracker>();
const trackVote = (name: string): VoteTracker => {
  if (!voteOps.has(name)) voteOps.set(name, { mutate: vi.fn(), update: null });
  return voteOps.get(name)!;
};
// Order matters: undoSuperUpvote and undoUpvoteComment both contain "upvote".
const detectVote = (src: string) =>
  ['undoSuperUpvote', 'undoUpvoteComment', 'upvoteComment'].find((n) =>
    src.includes(n)
  ) || 'generic';

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (
    doc: { loc?: { source?: { body?: string } } },
    options?: { update?: (cache: unknown, res: unknown) => void }
  ) => {
    const t = trackVote(detectVote(doc?.loc?.source?.body || ''));
    if (options?.update) t.update = options.update;
    return { mutate: t.mutate, error: { value: null }, loading: { value: false } };
  },
}));

vi.mock('@/composables/useAuthState', () =>
  createAuthStateMock({ username: 'alice' })
);

const comment = (overrides: Record<string, unknown>): Comment =>
  makeComment(overrides as Partial<Comment>);

const mountVotes = (commentData: Comment) =>
  mountWithDefaults(VoteButtons, {
    props: { commentData },
    global: { stubs: { VotesComponent: true, SuperUpvoteModal: true } },
  });

const votesProps = (wrapper: ReturnType<typeof mountVotes>) =>
  wrapper.findComponent(VotesComponent).props();

describe('VoteButtons', () => {
  it('passes the upvote count from the aggregate', () => {
    const wrapper = mountVotes(
      comment({ UpvotedByUsersAggregate: { count: 3 } })
    );
    expect(votesProps(wrapper).upvoteCount).toBe(3);
  });

  it('marks upvote active when the current user has upvoted', () => {
    const wrapper = mountVotes(
      comment({ UpvotedByUsers: [{ username: 'alice' }] })
    );
    expect(votesProps(wrapper).upvoteActive).toBe(true);
  });

  it('does not mark upvote active when another user upvoted', () => {
    const wrapper = mountVotes(
      comment({ UpvotedByUsers: [{ username: 'bob' }] })
    );
    expect(votesProps(wrapper).upvoteActive).toBe(false);
  });

  it('flags own content when the author is the current user', () => {
    const wrapper = mountVotes(
      comment({ CommentAuthor: { username: 'alice' } })
    );
    expect(votesProps(wrapper).isOwnContent).toBe(true);
  });

  it('marks downvote active when the user has left feedback comments', () => {
    const wrapper = mountVotes(comment({ FeedbackComments: [{ id: 'f1' }] }));
    expect(votesProps(wrapper).downvoteActive).toBe(true);
  });

  beforeEach(() => voteOps.clear());

  it('marks super-upvote active when the current user has super-upvoted', () => {
    const wrapper = mountVotes(
      comment({ SuperUpvotedByUsers: [{ username: 'alice' }] })
    );
    expect(votesProps(wrapper).superUpvoteActive).toBe(true);
  });

  it('falls back to the feedback aggregate when no feedback comments are loaded', () => {
    const wrapper = mountVotes(
      comment({ FeedbackComments: null, FeedbackCommentsAggregate: { count: 2 } })
    );
    expect(votesProps(wrapper).downvoteActive).toBe(true);
  });

  it('treats a moderation-profile author (no username) as not own content', () => {
    const wrapper = mountVotes(
      comment({ CommentAuthor: { __typename: 'ModerationProfile', displayName: 'ModX' } })
    );
    expect(votesProps(wrapper).isOwnContent).toBe(false);
  });

  describe('vote handlers', () => {
    it('calls the upvote mutation when the votes child emits upvote', async () => {
      const wrapper = mountVotes(comment({}));
      await wrapper.findComponent(VotesComponent).vm.$emit('upvote');
      expect(voteOps.get('upvoteComment')!.mutate).toHaveBeenCalled();
    });

    it('calls the undo-upvote mutation when the votes child emits undo-upvote', async () => {
      const wrapper = mountVotes(comment({}));
      await wrapper.findComponent(VotesComponent).vm.$emit('undo-upvote');
      expect(voteOps.get('undoUpvoteComment')!.mutate).toHaveBeenCalled();
    });

    it('calls undo-super-upvote with the comment source when the child emits it', async () => {
      const wrapper = mountVotes(comment({}));
      await wrapper.findComponent(VotesComponent).vm.$emit('undo-super-upvote');
      expect(voteOps.get('undoSuperUpvote')!.mutate).toHaveBeenCalledWith({
        sourceType: 'comment',
        sourceId: 'test-comment-1',
      });
    });

    it('opens the super-upvote modal when the child emits super-upvote', async () => {
      const wrapper = mountVotes(comment({}));
      await wrapper.findComponent(VotesComponent).vm.$emit('super-upvote');
      expect(wrapper.findComponent(SuperUpvoteModal).props('show')).toBe(true);
    });

    it('re-emits superUpvoteSuccess and closes the modal on modal success', async () => {
      const wrapper = mountVotes(comment({}));
      await wrapper.findComponent(VotesComponent).vm.$emit('super-upvote');
      await wrapper.findComponent(SuperUpvoteModal).vm.$emit('success');
      expect(wrapper.emitted('superUpvoteSuccess')).toBeTruthy();
    });
  });

  describe('feedback event passthrough', () => {
    it.each([
      ['undo-downvote', 'clickUndoFeedback'],
      ['open-mod-profile', 'openModProfile'],
      ['edit-feedback', 'clickEditFeedback'],
      ['undo-feedback', 'clickUndoFeedback'],
      ['view-feedback', 'viewFeedback'],
      ['give-feedback', 'clickFeedback'],
    ])('re-emits %s from the votes child as %s', async (childEvent, parentEvent) => {
      const wrapper = mountVotes(comment({}));
      await wrapper.findComponent(VotesComponent).vm.$emit(childEvent);
      expect(wrapper.emitted(parentEvent)).toBeTruthy();
    });
  });

  describe('undoSuperUpvote cache update', () => {
    // Invokes the captured update callback against a fake cache to exercise the
    // "drop the current actor from SuperUpvotedByUsers" field modifier.
    const runUpdate = (existing: Array<{ username: string }>) => {
      mountVotes(comment({}));
      const update = voteOps.get('undoSuperUpvote')!.update!;
      let filtered: unknown[] = [];
      const cache = {
        identify: vi.fn(() => 'Comment:test-comment-1'),
        modify: vi.fn(({ fields }: { fields: Record<string, (e: unknown[], h: unknown) => unknown[]> }) => {
          filtered = fields.SuperUpvotedByUsers(existing, {
            readField: (_f: string, u: { username: string }) => u.username,
          });
        }),
      };
      update(cache, { data: { undoSuperUpvote: { success: true } } });
      return { cache, filtered };
    };

    it('removes the current user from the super-upvoter list', () => {
      const { filtered } = runUpdate([{ username: 'alice' }, { username: 'bob' }]);
      expect(filtered).toEqual([{ username: 'bob' }]);
    });

    it('does nothing when the mutation did not succeed', () => {
      mountVotes(comment({}));
      const update = voteOps.get('undoSuperUpvote')!.update!;
      const cache = { identify: vi.fn(), modify: vi.fn() };
      update(cache, { data: { undoSuperUpvote: { success: false } } });
      expect(cache.modify).not.toHaveBeenCalled();
    });
  });
});
