import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import AlbumExistingImagePicker from '@/components/discussion/form/AlbumExistingImagePicker.vue';

const { usernameRef, queryResult, queryLoading, queryError } = vi.hoisted(
  () => ({
    usernameRef: { value: 'alice' as string },
    queryResult: {
      value: {
        users: [
          {
            Images: [
              {
                id: 'img-1',
                url: 'https://img.test/one.jpg',
                alt: 'One',
                caption: 'First image',
                copyright: '',
                Uploader: { username: 'alice', displayName: 'Alice' },
              },
            ],
            FavoriteImages: [
              {
                id: 'img-1',
                url: 'https://img.test/one.jpg',
                alt: 'One',
                caption: 'First image',
                copyright: '',
                Uploader: { username: 'alice', displayName: 'Alice' },
              },
              {
                id: 'img-2',
                url: 'https://img.test/two.jpg',
                alt: 'Two',
                caption: 'Second image',
                copyright: '',
                Uploader: { username: 'bob', displayName: 'Bob' },
              },
            ],
            Collections: [
              {
                id: 'collection-1',
                name: 'Inspiration',
                Images: [
                  {
                    id: 'img-3',
                    url: 'https://img.test/three.jpg',
                    alt: 'Three',
                    caption: 'Third image',
                    copyright: '',
                    Uploader: { username: 'carol', displayName: 'Carol' },
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    queryLoading: { value: false },
    queryError: { value: null as Error | null },
  })
);

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => usernameRef,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    result: queryResult,
    loading: queryLoading,
    error: queryError,
  })),
}));

const mountPicker = (selectedImageIds: string[] = []) =>
  mountWithDefaults(AlbumExistingImagePicker, {
    props: {
      selectedImageIds,
      isLimitReached: false,
    },
    global: {
      stubs: {
        LoadingSpinner: { template: '<div />' },
        ErrorBanner: { props: ['text'], template: '<div class="error" />' },
      },
    },
  });

beforeEach(() => {
  usernameRef.value = 'alice';
  queryLoading.value = false;
  queryError.value = null;
});

describe('AlbumExistingImagePicker', () => {
  it('dedupes images across uploads, favorites, and image collections', () => {
    const wrapper = mountPicker();
    expect({
      cardCount: wrapper.findAll('article').length,
      sourceCopy: wrapper.text(),
    }).toMatchObject({
      cardCount: 3,
      sourceCopy: expect.stringContaining('Your uploads · Favorites'),
    });
  });

  it('emits the selected image when adding it to the album', async () => {
    const wrapper = mountPicker();
    await wrapper.findAll('button')[2].trigger('click');
    expect(wrapper.emitted('addImage')?.[0]?.[0]).toMatchObject({
      id: 'img-3',
      Uploader: { username: 'carol' },
    });
  });

  it('disables images already selected in the album', () => {
    const wrapper = mountPicker(['img-1']);
    const firstButton = wrapper.find('button');
    expect({
      disabled: firstButton.attributes('disabled'),
      text: firstButton.text(),
    }).toEqual({
      disabled: '',
      text: 'Already in album',
    });
  });
});
