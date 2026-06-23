import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CommentHeader from '@/components/comments/CommentHeader.vue';
import type { Comment } from '@/__generated__/graphql';

const makeComment = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'c1',
    createdAt: '2020-01-01T00:00:00Z',
    CommentAuthor: { username: 'alice', displayName: '', profilePicURL: '' },
    ...overrides,
  }) as unknown as Comment;

const mountHeader = (props: Record<string, unknown> = {}) =>
  mount(CommentHeader, {
    props: { commentData: makeComment(), ...props },
    global: {
      stubs: {
        AvatarComponent: true,
        CommentEditsDropdown: { name: 'CommentEditsDropdown', props: ['comment'], template: '<div />' },
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

describe('CommentHeader author', () => {
  it('shows the author username', () => {
    const wrapper = mountHeader();

    expect(wrapper.text()).toContain('alice');
  });

  it('shows the display name with the username in parentheses', () => {
    const wrapper = mountHeader({
      commentData: makeComment({
        CommentAuthor: { username: 'alice', displayName: 'Alice A' },
      }),
    });

    expect(wrapper.text()).toContain('Alice A');
  });

  it('shows [Deleted] when there is no author', () => {
    const wrapper = mountHeader({ commentData: makeComment({ CommentAuthor: null }) });

    expect(wrapper.text()).toContain('[Deleted]');
  });

  it('marks bot authors with a bot badge', () => {
    const wrapper = mountHeader({ botUsernames: ['alice'] });

    expect(wrapper.text()).toContain('Bot');
  });
});

describe('CommentHeader timestamps', () => {
  it('shows a posted-time string', () => {
    const wrapper = mountHeader();

    expect(wrapper.text()).toContain('posted');
  });

  it('includes the channel when showChannel is set', () => {
    const wrapper = mountHeader({
      showChannel: true,
      commentData: makeComment({ DiscussionChannel: { channelUniqueName: 'cats' } }),
    });

    expect(wrapper.text()).toContain('in c/cats');
  });

  it('shows an edited time from textLastEdited', () => {
    const wrapper = mountHeader({
      commentData: makeComment({ textLastEdited: '2020-06-01T00:00:00Z' }),
    });

    expect(wrapper.text()).toContain('Edited');
  });

  it('falls back to updatedAt with past versions for the edited time', () => {
    const wrapper = mountHeader({
      commentData: makeComment({
        updatedAt: '2020-06-01T00:00:00Z',
        PastVersions: [{ id: 'v1' }],
      }),
    });

    expect(wrapper.text()).toContain('Edited');
  });

  it('shows the edits dropdown when there is revision history', () => {
    const wrapper = mountHeader({
      commentData: makeComment({
        textLastEdited: '2020-06-01T00:00:00Z',
        PastVersions: [{ id: 'v1' }],
      }),
    });

    expect(wrapper.findComponent({ name: 'CommentEditsDropdown' }).exists()).toBe(
      true
    );
  });
});

describe('CommentHeader badges', () => {
  it('shows a Forum Admin badge', () => {
    const wrapper = mountHeader({ forumRoleBadge: 'forumAdmin' });

    expect(wrapper.text()).toContain('Forum Admin');
  });

  it('shows a Forum Mod badge', () => {
    const wrapper = mountHeader({ forumRoleBadge: 'forumMod' });

    expect(wrapper.text()).toContain('Forum Mod');
  });

  it('shows an OP badge for the original poster', () => {
    const wrapper = mountHeader({ originalPoster: 'alice' });

    expect(wrapper.text()).toContain('OP');
  });

  it('shows a Permalinked badge when highlighted', () => {
    const wrapper = mountHeader({ isHighlighted: true });

    expect(wrapper.text()).toContain('Permalinked');
  });

  it('shows a custom label', () => {
    const wrapper = mountHeader({ label: 'Pinned' });

    expect(wrapper.text()).toContain('Pinned');
  });

  it('shows a Best Answer badge', () => {
    const wrapper = mountHeader({ isAnswer: true });

    expect(wrapper.text()).toContain('Best Answer');
  });
});

describe('CommentHeader context link', () => {
  const withContext = (extra: Record<string, unknown>) =>
    makeComment({
      DiscussionChannel: { channelUniqueName: 'cats', discussionId: 'd1' },
      Channel: { uniqueName: 'cats' },
      ...extra,
    });

  it('links to the comment by default', () => {
    const wrapper = mountHeader({
      parentCommentId: 'p1',
      commentData: withContext({}),
    });

    expect(wrapper.text()).toContain('View Context');
  });

  it('links to the parent comment when present', () => {
    const wrapper = mountHeader({
      parentCommentId: 'p1',
      commentData: withContext({ ParentComment: { id: 'parent1' } }),
    });

    const link = wrapper
      .findAll('a')
      .find((a) => a.text() === 'View Context');
    expect(link?.exists()).toBe(true);
  });

  it('links to the discussion it gives feedback on', () => {
    const wrapper = mountHeader({
      parentCommentId: 'p1',
      commentData: withContext({ GivesFeedbackOnDiscussion: { id: 'd9' } }),
    });

    expect(wrapper.text()).toContain('View Context');
  });
});
