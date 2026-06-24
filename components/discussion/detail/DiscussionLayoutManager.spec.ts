import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import DiscussionLayoutManager from '@/components/discussion/detail/DiscussionLayoutManager.vue';
import type { Discussion } from '@/__generated__/graphql';

const ALL_EVENTS = [
  'discussion-refetch',
  'discussion-channel-refetch',
  'handle-click-add-album',
  'edit-album',
  'handle-click-edit-feedback',
  'handle-click-give-feedback',
  'handle-click-undo-feedback',
];

// [child kebab event, parent camel event]
const REEMITS: [string, string][] = [
  ['discussion-refetch', 'discussionRefetch'],
  ['discussion-channel-refetch', 'discussionChannelRefetch'],
  ['edit-album', 'editAlbum'],
  ['handle-click-edit-feedback', 'handleClickEditFeedback'],
  ['handle-click-give-feedback', 'handleClickGiveFeedback'],
  ['handle-click-undo-feedback', 'handleClickUndoFeedback'],
];

const layoutStub = (name: string) => ({
  name,
  emits: ALL_EVENTS,
  template: `<div class="${name}" />`,
});

const mountManager = (props: Record<string, unknown> = {}) =>
  mount(DiscussionLayoutManager, {
    props: {
      discussion: { id: 'd1' } as unknown as Discussion,
      discussionId: 'd1',
      channelId: 'cats',
      ...props,
    },
    global: {
      stubs: {
        DownloadModeLayout: layoutStub('DownloadModeLayout'),
        RegularDiscussionLayout: layoutStub('RegularDiscussionLayout'),
        DownloadTabNavigation: { name: 'DownloadTabNavigation', template: '<div class="tabs" />' },
      },
    },
  });

describe('DiscussionLayoutManager', () => {
  it('renders the regular layout by default', () => {
    const wrapper = mountManager();

    expect(wrapper.find('.RegularDiscussionLayout').exists()).toBe(true);
  });

  it('does not render the download layout by default', () => {
    const wrapper = mountManager();

    expect(wrapper.find('.DownloadModeLayout').exists()).toBe(false);
  });

  it('renders the download layout in download mode', () => {
    const wrapper = mountManager({ downloadMode: true });

    expect(wrapper.find('.DownloadModeLayout').exists()).toBe(true);
  });

  it('renders the download tabs in download mode', () => {
    const wrapper = mountManager({ downloadMode: true });

    expect(wrapper.find('.tabs').exists()).toBe(true);
  });

  it('hides the download tabs in regular mode', () => {
    const wrapper = mountManager();

    expect(wrapper.find('.tabs').exists()).toBe(false);
  });

  it.each(REEMITS)(
    're-emits %s as %s from the regular layout',
    async (childEvent, parentEvent) => {
      const wrapper = mountManager();

      await wrapper.getComponent({ name: 'RegularDiscussionLayout' }).vm.$emit(childEvent);

      expect(wrapper.emitted(parentEvent)).toBeTruthy();
    }
  );

  it.each([...REEMITS, ['handle-click-add-album', 'handleClickAddAlbum']])(
    're-emits %s as %s from the download layout',
    async (childEvent, parentEvent) => {
      const wrapper = mountManager({ downloadMode: true });

      await wrapper.getComponent({ name: 'DownloadModeLayout' }).vm.$emit(childEvent);

      expect(wrapper.emitted(parentEvent)).toBeTruthy();
    }
  );
});
