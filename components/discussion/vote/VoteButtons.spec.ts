import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import VoteButtons from '@/components/discussion/vote/VoteButtons.vue';

const requireAuthStub = (authed: boolean) => ({
  name: 'RequireAuth',
  template: authed
    ? '<div><slot name="has-auth" /></div>'
    : '<div><slot name="does-not-have-auth" /></div>',
});

const voteButtonStub = {
  name: 'VoteButton',
  props: ['active', 'count', 'testId', 'loading', 'tooltipText', 'showCount', 'isPermalinked', 'buttonProps'],
  emits: ['vote'],
  template: '<button :data-testid="testId" @click="$emit(\'vote\')"><slot /></button>',
};

const menuButtonStub = {
  name: 'MenuButton',
  props: ['items', 'disabled'],
  emits: ['edit-feedback', 'give-feedback', 'undo-feedback', 'view-feedback'],
  template: '<div class="menu"><slot name="activator" :props="{}" /></div>',
};

const mountButtons = (props: Record<string, unknown> = {}, authed = true) =>
  mount(VoteButtons, {
    props,
    global: {
      stubs: {
        RequireAuth: requireAuthStub(authed),
        VoteButton: voteButtonStub,
        MenuButton: menuButtonStub,
        FlagIcon: true,
      },
    },
  });

const button = (w: ReturnType<typeof mount>, testId: string) =>
  w.find(`[data-testid="${testId}"]`);
const menu = (w: ReturnType<typeof mount>) => w.getComponent(menuButtonStub);

beforeEach(() => {});

describe('VoteButtons (authenticated)', () => {
  it('shows the upvote button with its count', () => {
    const wrapper = mountButtons({ upvoteCount: 7 });

    expect(button(wrapper, 'upvote-discussion-button').text()).toContain('7');
  });

  it('hides the upvote button when showUpvote is false', () => {
    const wrapper = mountButtons({ showUpvote: false });

    expect(button(wrapper, 'upvote-discussion-button').exists()).toBe(false);
  });

  it('emits clickUp when the upvote button is clicked', async () => {
    const wrapper = mountButtons();

    await button(wrapper, 'upvote-discussion-button').trigger('click');

    expect(wrapper.emitted('clickUp')).toBeTruthy();
  });
});

describe('VoteButtons super upvote', () => {
  it('shows the super upvote button when upvoted and not own content', () => {
    const wrapper = mountButtons({ upvoteActive: true, isOwnContent: false });

    expect(button(wrapper, 'super-upvote-discussion-button').exists()).toBe(true);
  });

  it('hides the super upvote button on own content', () => {
    const wrapper = mountButtons({ upvoteActive: true, isOwnContent: true });

    expect(button(wrapper, 'super-upvote-discussion-button').exists()).toBe(false);
  });

  it('emits superUpvote when inactive', async () => {
    const wrapper = mountButtons({ upvoteActive: true, superUpvoteActive: false });

    await button(wrapper, 'super-upvote-discussion-button').trigger('click');

    expect(wrapper.emitted('superUpvote')).toBeTruthy();
  });

  it('emits undoSuperUpvote when already active', async () => {
    const wrapper = mountButtons({ upvoteActive: true, superUpvoteActive: true });

    await button(wrapper, 'super-upvote-discussion-button').trigger('click');

    expect(wrapper.emitted('undoSuperUpvote')).toBeTruthy();
  });
});

describe('VoteButtons feedback menu', () => {
  it('offers Give Feedback when no feedback exists', () => {
    const wrapper = mountButtons({ downvoteActive: false });

    const labels = menu(wrapper).props('items').map((i: { label: string }) => i.label);
    expect(labels).toContain('Give Feedback');
  });

  it('offers Undo and Edit Feedback when feedback exists', () => {
    const wrapper = mountButtons({ downvoteActive: true });

    const labels = menu(wrapper).props('items').map((i: { label: string }) => i.label);
    expect(labels).toEqual(
      expect.arrayContaining(['Undo Feedback', 'Edit Feedback'])
    );
  });

  it('re-emits giveFeedback from the menu', async () => {
    const wrapper = mountButtons();

    await menu(wrapper).vm.$emit('give-feedback');

    expect(wrapper.emitted('giveFeedback')).toBeTruthy();
  });

  it('re-emits viewFeedback from the menu', async () => {
    const wrapper = mountButtons();

    await menu(wrapper).vm.$emit('view-feedback');

    expect(wrapper.emitted('viewFeedback')).toBeTruthy();
  });
});

describe('VoteButtons (unauthenticated)', () => {
  it('shows the upvote button with the unauthenticated tooltip', () => {
    const wrapper = mountButtons({ upvoteCount: 2 }, false);

    expect(
      wrapper.getComponent(voteButtonStub).props('tooltipText')
    ).toContain('Make this discussion more visible');
  });

  it('disables the feedback menu', () => {
    const wrapper = mountButtons({}, false);

    expect(menu(wrapper).props('disabled')).toBe(true);
  });
});
