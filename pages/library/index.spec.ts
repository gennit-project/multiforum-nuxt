import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import type { ref } from 'vue';
import LibraryFavoriteRow from '@/components/library/LibraryFavoriteRow.vue';

const mocks = vi.hoisted(() => ({
  result: null as unknown as ReturnType<typeof ref>,
  loading: null as unknown as ReturnType<typeof ref<boolean>>,
  error: null as unknown as ReturnType<typeof ref>,
  username: null as unknown as ReturnType<typeof ref<string>>,
  useHead: vi.fn(),
}));

vi.mock('nuxt/app', () => ({ useHead: mocks.useHead }));

vi.mock('@vue/apollo-composable', async () => {
  const { ref: vueRef } = await import('vue');
  mocks.result = vueRef(null);
  mocks.loading = vueRef(false);
  mocks.error = vueRef(null);
  return {
    useQuery: () => ({
      result: mocks.result,
      loading: mocks.loading,
      error: mocks.error,
    }),
  };
});

vi.mock('@/composables/useAuthState', async () => {
  const { ref: vueRef } = await import('vue');
  mocks.username = vueRef('alice');
  return { useUsername: () => mocks.username };
});

const favorites = {
  users: [
    {
      FavoriteDiscussions: [
        {
          id: 'discussion-1',
          title: 'A saved discussion',
          body: 'Discussion body',
          createdAt: '2026-09-29T12:00:00.000Z',
          hasDownload: false,
          Author: { username: 'maya', displayName: 'Maya' },
          DiscussionChannels: [
            {
              channelUniqueName: 'design',
              Channel: { uniqueName: 'design', displayName: 'Design' },
            },
          ],
          Album: {
            id: 'album-1',
            imageOrder: ['cover'],
            Images: [{ id: 'cover', url: '/cover.jpg' }],
          },
        },
        {
          id: 'download-1',
          title: 'A saved download',
          body: 'Download body',
          createdAt: '2026-09-28T12:00:00.000Z',
          hasDownload: true,
          Author: { username: 'li', displayName: 'Li' },
          DiscussionChannels: [],
          Album: null,
        },
      ],
      FavoriteImages: [
        {
          id: 'image-1',
          url: '/image.jpg',
          alt: 'A bright orange poster',
          caption: 'Poster',
          createdAt: '2026-09-27T12:00:00.000Z',
          Uploader: { username: 'zoe', displayName: 'Zoe' },
          Albums: [
            {
              id: 'image-album-1',
              Discussions: [
                {
                  DiscussionChannels: [
                    {
                      channelUniqueName: 'art',
                      Channel: {
                        uniqueName: 'art',
                        displayName: 'Art Forum',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      FavoriteComments: [],
      FavoriteChannels: [],
    },
  ],
};

const mountPage = async () => {
  const Page = (await import('./index.vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        BookmarkIcon: true,
        ErrorBanner: true,
        LibraryFavoriteRow: true,
      },
    },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.result.value = favorites;
  mocks.loading.value = false;
  mocks.error.value = null;
  mocks.username.value = 'alice';
});

describe('library index page', () => {
  it('sets the page title to Library', async () => {
    await mountPage();
    expect(mocks.useHead).toHaveBeenCalledWith({ title: 'Library' });
  });

  it('combines saved content types into one list', async () => {
    const wrapper = await mountPage();
    expect(wrapper.findAllComponents(LibraryFavoriteRow)).toHaveLength(3);
  });

  it('keeps forum and uploader source data on each normalized row', async () => {
    const wrapper = await mountPage();
    expect(
      wrapper.findComponent(LibraryFavoriteRow).props('item').source
    ).toEqual({
      forumName: 'Design',
      forumUniqueName: 'design',
      uploaderName: 'Maya',
      uploaderUsername: 'maya',
    });
  });

  it('filters the unified list by content type', async () => {
    const wrapper = await mountPage();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Images')!
      .trigger('click');
    expect(wrapper.findAllComponents(LibraryFavoriteRow)).toHaveLength(1);
  });

  it('searches source uploader names', async () => {
    const wrapper = await mountPage();
    await wrapper.get('input[type="search"]').setValue('zoe');
    expect(wrapper.findComponent(LibraryFavoriteRow).props('item').id).toBe(
      'image-1'
    );
  });

  it('reads an image forum from its first album', async () => {
    const wrapper = await mountPage();
    const imageRow = wrapper
      .findAllComponents(LibraryFavoriteRow)
      .find((row) => row.props('item').id === 'image-1');
    expect(imageRow?.props('item').source.forumUniqueName).toBe('art');
  });

  it('shows stable loading skeleton rows before favorites arrive', async () => {
    mocks.result.value = null;
    mocks.loading.value = true;
    const wrapper = await mountPage();
    expect(wrapper.get('[aria-label="Loading favorite items"]').exists()).toBe(
      true
    );
  });

  it('shows an empty state when no favorites exist', async () => {
    mocks.result.value = { users: [{}] };
    const wrapper = await mountPage();
    expect(wrapper.text()).toContain('No favorites yet');
  });

  it('removes an item after the row emits removed', async () => {
    const wrapper = await mountPage();
    await wrapper
      .findComponent(LibraryFavoriteRow)
      .vm.$emit('removed', 'discussion-1');
    await wrapper.vm.$nextTick();
    expect(wrapper.findAllComponents(LibraryFavoriteRow)).toHaveLength(2);
  });
});
