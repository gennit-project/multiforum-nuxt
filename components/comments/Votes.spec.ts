import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import Votes from '@/components/comments/Votes.vue';

const voteButtonStub = {
  name: 'VoteButton',
  props: ['active', 'count', 'testId', 'loading', 'tooltipText', 'showCount', 'isPermalinked', 'isMarkedAsAnswer'],
  emits: ['vote'],
  template: '<button :data-testid="testId" @click="$emit(\'vote\')"><slot /></button>',
};

const menuButtonStub = {
  name: 'MenuButton',
  props: ['items', 'ariaLabel'],
  emits: ['view-feedback', 'give-feedback', 'edit-feedback', 'undo-feedback'],
  template: '<div class="menu"><slot /></div>',
};

const mountVotes = (props: Record<string, unknown> = {}) =>
  mount(Votes, {
    props,
    global: { stubs: { VoteButton: voteButtonStub, MenuButton: menuButtonStub, FlagIcon: true } },
  });

const button = (w: ReturnType<typeof mount>, testId: string) =>
  w.find(`[data-testid="${testId}"]`);
const menu = (w: ReturnType<typeof mount>) => w.getComponent(menuButtonStub);

describe('Votes upvote', () => {
  it('shows the upvote button with its count', () => {
    const wrapper = mountVotes({ upvoteCount: 5 });

    expect(button(wrapper, 'upvote-comment-button').text()).toContain('5');
  });

  it('hides the upvote button when showUpvote is false', () => {
    const wrapper = mountVotes({ showUpvote: false });

    expect(button(wrapper, 'upvote-comment-button').exists()).toBe(false);
  });

  it('emits upvote when inactive', async () => {
    const wrapper = mountVotes({ upvoteActive: false });

    await button(wrapper, 'upvote-comment-button').trigger('click');

    expect(wrapper.emitted('upvote')).toBeTruthy();
  });

  it('emits undoUpvote when already upvoted', async () => {
    const wrapper = mountVotes({ upvoteActive: true });

    await button(wrapper, 'upvote-comment-button').trigger('click');

    expect(wrapper.emitted('undoUpvote')).toBeTruthy();
  });
});

describe('Votes super upvote', () => {
  it('shows the super upvote button when upvoted and not own content', () => {
    const wrapper = mountVotes({ upvoteActive: true, isOwnContent: false });

    expect(button(wrapper, 'super-upvote-comment-button').exists()).toBe(true);
  });

  it('hides the super upvote button on own content', () => {
    const wrapper = mountVotes({ upvoteActive: true, isOwnContent: true });

    expect(button(wrapper, 'super-upvote-comment-button').exists()).toBe(false);
  });

  it('emits superUpvote when inactive', async () => {
    const wrapper = mountVotes({ upvoteActive: true, superUpvoteActive: false });

    await button(wrapper, 'super-upvote-comment-button').trigger('click');

    expect(wrapper.emitted('superUpvote')).toBeTruthy();
  });

  it('emits undoSuperUpvote when active', async () => {
    const wrapper = mountVotes({ upvoteActive: true, superUpvoteActive: true });

    await button(wrapper, 'super-upvote-comment-button').trigger('click');

    expect(wrapper.emitted('undoSuperUpvote')).toBeTruthy();
  });
});

describe('Votes feedback menu', () => {
  it('offers Give Feedback when no feedback exists', () => {
    const wrapper = mountVotes({ downvoteActive: false });

    const labels = menu(wrapper).props('items').map((i: { label: string }) => i.label);
    expect(labels).toContain('Give Feedback');
  });

  it('offers Undo and Edit Feedback when feedback exists', () => {
    const wrapper = mountVotes({ downvoteActive: true });

    const labels = menu(wrapper).props('items').map((i: { label: string }) => i.label);
    expect(labels).toEqual(expect.arrayContaining(['Undo Feedback', 'Edit Feedback']));
  });

  it('uses active styling for the downvote when feedback is given', () => {
    const wrapper = mountVotes({ downvoteActive: true });

    expect(wrapper.html()).toContain('bg-orange-400');
  });

  it('uses green styling for a best-answer downvote', () => {
    const wrapper = mountVotes({ downvoteActive: true, isMarkedAsAnswer: true });

    expect(wrapper.html()).toContain('bg-green-500');
  });

  it('re-emits giveFeedback from the menu', async () => {
    const wrapper = mountVotes();

    await menu(wrapper).vm.$emit('give-feedback');

    expect(wrapper.emitted('giveFeedback')).toBeTruthy();
  });

  it('hides the menu when showDownvote is false', () => {
    const wrapper = mountVotes({ showDownvote: false });

    expect(wrapper.findComponent(menuButtonStub).exists()).toBe(false);
  });
});
