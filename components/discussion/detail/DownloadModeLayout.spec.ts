import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

import DownloadModeLayout from '@/components/discussion/detail/DownloadModeLayout.vue';
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

const channel = () =>
  ({ id: 'dc1', channelUniqueName: 'cats', Channel: {} }) as unknown as DiscussionChannel;

const discussionBodyStub = {
  name: 'DiscussionBody',
  template:
    '<div><slot name="album-slot" /><slot name="mark-answered-slot" /><slot name="button-slot" /></div>',
};

const mountLayout = (props: Record<string, unknown> = {}) =>
  mount(DownloadModeLayout, {
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
        DownloadSidebar: { name: 'DownloadSidebar', template: '<div class="sidebar" />' },
        CrosspostedDiscussionEmbed: true,
        ImageIcon: true,
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.username = ref('alice');
});

describe('DownloadModeLayout album empty state', () => {
  it('offers the author an Add Images button when there is no album', () => {
    const wrapper = mountLayout();

    expect(wrapper.find('[data-testid="add-album-button"]').exists()).toBe(true);
  });

  it('shows "No images available" to non-authors', () => {
    h.username = ref('bob');
    const wrapper = mountLayout();

    expect(wrapper.text()).toContain('No images available');
  });

  it('emits handleClickAddAlbum from the Add Images button', async () => {
    const wrapper = mountLayout();

    await wrapper.find('[data-testid="add-album-button"]').trigger('click');

    expect(wrapper.emitted('handleClickAddAlbum')).toBeTruthy();
  });
});

describe('DownloadModeLayout album present', () => {
  it('renders the album when there are images', async () => {
    const wrapper = mountLayout({
      discussion: discussion({ Album: { Images: [{ id: 'i1' }] } }),
    });
    await flushPromises();

    expect(wrapper.find('.album').exists()).toBe(true);
  });

  it('treats an STL download as an album', async () => {
    const wrapper = mountLayout({
      discussion: discussion({
        Album: { Images: [] },
        DownloadableFiles: [{ fileName: 'model.STL', url: '' }],
      }),
    });
    await flushPromises();

    expect(wrapper.getComponent({ name: 'DiscussionAlbum' }).props('stlFiles')).toHaveLength(1);
  });
});

describe('DownloadModeLayout sidebar and votes', () => {
  it('renders the download sidebar', () => {
    const wrapper = mountLayout();

    expect(wrapper.find('.sidebar').exists()).toBe(true);
  });

  it('shows the mark-answered button to the author', () => {
    const wrapper = mountLayout();

    expect(wrapper.find('.answered').exists()).toBe(true);
  });

  it('re-emits give-feedback from the votes component', async () => {
    h.username = ref('bob');
    const wrapper = mountLayout();

    await wrapper.getComponent({ name: 'DiscussionVotes' }).vm.$emit('handle-click-give-feedback');

    expect(wrapper.emitted('handleClickGiveFeedback')).toBeTruthy();
  });
});
