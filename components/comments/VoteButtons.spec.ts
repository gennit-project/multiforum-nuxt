import { describe, it, expect, vi } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createCacheMock } from '@/tests/utils/mockAuth';
import { makeComment } from '@/tests/utils/factories';
import VotesComponent from '@/components/comments/Votes.vue';
import type { Comment } from '@/__generated__/graphql';

import VoteButtons from '@/components/comments/VoteButtons.vue';

// The four vote mutations just need to be callable; a minimal stub avoids
// pulling the real Apollo composable.
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: () => {},
    error: { value: null },
    loading: { value: false },
  }),
}));

vi.mock('@/cache', () => createCacheMock({ username: 'alice' }));

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
});
