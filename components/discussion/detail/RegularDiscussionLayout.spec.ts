import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

import RegularDiscussionLayout from '@/components/discussion/detail/RegularDiscussionLayout.vue';
import type { Discussion, DiscussionChannel } from '@/__generated__/graphql';

const h = vi.hoisted(() => ({ username: null as unknown }));

vi.mock('@/composables/useAuthState', () => ({ useUsername: () => h.username }));

const discussion = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'd1',
    Author: { username: 'alice' },
    Album: { Images: [] },
    DownloadableFiles: [],
    ...overrides,
  }) as unknown as Discussion;

const channel = (channelOverrides: Record<string, unknown> = {}) =>
  ({ id: 'dc1', channelUniqueName: 'cats', Channel: channelOverrides }) as unknown as DiscussionChannel;

const discussionBodyStub = {
  name: 'DiscussionBody',
  props: ['showEmojiButton', 'allowImages'],
  template:
    '<div><slot name="album-slot" /><slot name="activity-feed-slot" /><slot name="mark-answered-slot" /><slot name="button-slot" /></div>',
};

const mountLayout = (props: Record<string, unknown> = {}) =>
  mount(RegularDiscussionLayout, {
    props: {
      discussion: discussion(),
      discussionId: 'd1',
      channelId: 'cats',
      activeDiscussionChannel: channel(),
      ...props,
    },
    global: {
      stubs: {
        DiscussionBody: discussionBodyStub,
        DiscussionAlbum: { name: 'DiscussionAlbum', props: ['stlFiles'], template: '<div class="album" />' },
        DiscussionVotes: { name: 'DiscussionVotes', emits: ['handle-click-give-feedback'], template: '<div class="votes" />' },
        MarkAsAnsweredButton: { name: 'MarkAsAnsweredButton', template: '<div class="answered" />' },
        DiscussionTitleVersions: { name: 'DiscussionTitleVersions', template: '<div class="versions" />' },
        CrosspostedDiscussionEmbed: { name: 'CrosspostedDiscussionEmbed', template: '<div class="crosspost" />' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.username = ref('alice');
});

describe('RegularDiscussionLayout album', () => {
  it('renders the album when there are images', async () => {
    const wrapper = mountLayout({
      discussion: discussion({ Album: { Images: [{ id: 'i1' }] } }),
    });
    await flushPromises();

    expect(wrapper.find('.album').exists()).toBe(true);
  });

  it('omits the album when there are no images or files', async () => {
    const wrapper = mountLayout();
    await flushPromises();

    expect(wrapper.find('.album').exists()).toBe(false);
  });

  it('treats an STL download as an album', async () => {
    const wrapper = mountLayout({
      discussion: discussion({ DownloadableFiles: [{ fileName: 'm.stl', url: '' }] }),
    });
    await flushPromises();

    expect(wrapper.getComponent({ name: 'DiscussionAlbum' }).props('stlFiles')).toHaveLength(1);
  });
});

describe('RegularDiscussionLayout sections', () => {
  it('shows title versions when past versions exist', () => {
    const wrapper = mountLayout({
      discussion: discussion({ PastTitleVersions: [{ id: 'v1' }] }),
    });

    expect(wrapper.find('.versions').exists()).toBe(true);
  });

  it('hides title versions when there are none', () => {
    const wrapper = mountLayout();

    expect(wrapper.find('.versions').exists()).toBe(false);
  });

  it('shows the mark-answered button to the author', () => {
    const wrapper = mountLayout();

    expect(wrapper.find('.answered').exists()).toBe(true);
  });

  it('hides the mark-answered button from non-authors', () => {
    h.username = ref('bob');
    const wrapper = mountLayout();

    expect(wrapper.find('.answered').exists()).toBe(false);
  });

  it('renders a crossposted embed when present', () => {
    const wrapper = mountLayout({
      discussion: discussion({ CrosspostedDiscussion: { id: 'x1' } }),
    });

    expect(wrapper.find('.crosspost').exists()).toBe(true);
  });
});

describe('RegularDiscussionLayout config', () => {
  it('disables the emoji button when emoji is disabled', () => {
    const wrapper = mountLayout({
      activeDiscussionChannel: channel({ emojiEnabled: false }),
    });

    expect(wrapper.getComponent(discussionBodyStub).props('showEmojiButton')).toBe(
      false
    );
  });

  it('re-emits give-feedback from the votes component', async () => {
    h.username = ref('bob');
    const wrapper = mountLayout();

    await wrapper.getComponent({ name: 'DiscussionVotes' }).vm.$emit('handle-click-give-feedback');

    expect(wrapper.emitted('handleClickGiveFeedback')).toBeTruthy();
  });
});
