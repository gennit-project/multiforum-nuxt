import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import SitewideDownloadListItem from '@/components/discussion/list/SitewideDownloadListItem.vue';

const channelState = vi.hoisted(() => ({
  selectedChannels: { value: [] as string[] },
  hasSelectedChannels: { value: false },
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { username: 'alice' }, query: {} }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/composables/useSelectedChannelsFromQuery', () => ({
  useSelectedChannelsFromQuery: () => ({
    selectedChannels: channelState.selectedChannels,
    hasSelectedChannels: channelState.hasSelectedChannels,
  }),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (result: unknown) => {
  mockedUseQuery.mockReturnValue({
    result: ref(result),
    loading: ref(false),
    error: ref(null),
  });
  const Page = (await import('./downloads.vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        DiscussionAlbum: {
          name: 'DiscussionAlbum',
          props: [
            'album',
            'discussionId',
            'discussionAuthor',
            'showEditAlbum',
            'startInLightbox',
          ],
          emits: ['close-lightbox'],
          template: '<div />',
        },
      },
    },
  });
};

describe('user downloads profile page', () => {
  it('shows an empty-state message when the user has no downloads', async () => {
    const wrapper = await mountWith({ users: [{ Discussions: [] }] });
    expect(wrapper.text()).toContain('No downloads yet');
  });

  it('renders an item per download', async () => {
    const wrapper = await mountWith({
      users: [{ Discussions: [{ id: 'd1' }, { id: 'd2' }] }],
    });
    expect(wrapper.findAllComponents(SitewideDownloadListItem)).toHaveLength(2);
  });

  it('adds selected channels to the downloads query', async () => {
    channelState.selectedChannels.value = ['downloads'];
    channelState.hasSelectedChannels.value = true;
    await mountWith({ users: [{ Discussions: [] }] });

    expect(mockedUseQuery.mock.calls.at(-1)?.[1]()).toEqual({
      username: 'alice',
      where: {
        AND: [
          { hasDownload: true },
          {
            DiscussionChannels_SOME: {
              channelUniqueName_IN: ['downloads'],
            },
          },
        ],
      },
    });
  });

  it('opens an album emitted by a download card', async () => {
    const discussion = {
      id: 'd1',
      Author: { username: 'alice' },
      Album: { id: 'album-1' },
    };
    const wrapper = await mountWith({ users: [{ Discussions: [discussion] }] });

    wrapper
      .findComponent(SitewideDownloadListItem)
      .vm.$emit('open-album', { discussion, album: discussion.Album });
    await wrapper.vm.$nextTick();

    expect(
      wrapper.findComponent({ name: 'DiscussionAlbum' }).props()
    ).toMatchObject({
      album: { id: 'album-1' },
      discussionId: 'd1',
      discussionAuthor: 'alice',
      showEditAlbum: false,
      startInLightbox: true,
    });
  });

  it('closes an open download album', async () => {
    const discussion = { id: 'd1', Author: null, Album: { id: 'album-1' } };
    const wrapper = await mountWith({ users: [{ Discussions: [discussion] }] });
    wrapper
      .findComponent(SitewideDownloadListItem)
      .vm.$emit('open-album', { discussion, album: discussion.Album });
    await wrapper.vm.$nextTick();

    wrapper
      .findComponent({ name: 'DiscussionAlbum' })
      .vm.$emit('close-lightbox');
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: 'DiscussionAlbum' }).exists()).toBe(
      false
    );
  });
});
