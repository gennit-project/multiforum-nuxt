import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import { useMutation } from '@vue/apollo-composable';
import { configureApolloMocks } from '@/tests/utils/mockApollo';
import type { Album } from '@/__generated__/graphql';

import DiscussionAlbum from '@/components/discussion/detail/DiscussionAlbum.vue';

vi.mock('@vue/apollo-composable', () => ({ useMutation: vi.fn() }));
vi.mock('nuxt/app', () => ({
  useRoute: vi.fn(() => ({ params: { forumId: 'cats' } })),
}));
vi.mock('@/cache', () => ({ usernameVar: { value: 'alice' } }));

const stubs = {
  ModelViewer: { template: '<div class="model-viewer-stub" />' },
  StlViewer: { template: '<div class="stl-viewer-stub" />' },
  CarouselThumbnail: { template: '<div />' },
  ImageLightbox: { template: '<div class="lightbox-stub" />' },
  TextEditor: { template: '<div />' },
  SaveButton: { template: '<button />' },
  CancelButton: { template: '<button />' },
  LeftArrowIcon: { template: '<i />' },
  RightArrowIcon: { template: '<i />' },
  PencilIcon: { template: '<i />' },
};

const makeImage = (id: string) => ({
  id,
  url: `https://example.com/${id}.jpg`,
  alt: `alt-${id}`,
  caption: '',
  __typename: 'Image',
});

const makeAlbum = (imageIds: string[], imageOrder?: string[]): Album =>
  ({
    id: 'album-1',
    Images: imageIds.map(makeImage),
    imageOrder: imageOrder ?? imageIds,
    __typename: 'Album',
  }) as unknown as Album;

const mountAlbum = (props: Record<string, unknown> = {}) => {
  configureApolloMocks({ useMutation });
  return mountWithDefaults(DiscussionAlbum, {
    props: {
      album: makeAlbum(['a', 'b', 'c']),
      discussionId: 'd1',
      discussionAuthor: 'alice',
      ...props,
    },
    global: { stubs },
  });
};

describe('DiscussionAlbum', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // One direct child div of the grid is rendered per ordered image.
  const cells = (wrapper: ReturnType<typeof mountAlbum>) =>
    wrapper.findAll('.grid-cols-3 > div');

  it('renders one grid cell per album image', () => {
    expect(cells(mountAlbum())).toHaveLength(3);
  });

  it('renders no cells for an empty album', () => {
    expect(cells(mountAlbum({ album: makeAlbum([]) }))).toHaveLength(0);
  });

  it('falls back to the Images array (in order) when imageOrder is empty', () => {
    const wrapper = mountAlbum({ album: makeAlbum(['a', 'b'], []) });
    const srcs = cells(wrapper).map((cell) => cell.find('img').attributes('src'));
    expect(srcs).toEqual([
      'https://example.com/a.jpg',
      'https://example.com/b.jpg',
    ]);
  });

  it('orders the cells according to imageOrder', () => {
    const wrapper = mountAlbum({ album: makeAlbum(['a', 'b', 'c'], ['c', 'a', 'b']) });
    const firstImg = cells(wrapper)[0].find('img');
    expect(firstImg.attributes('src')).toContain('/c.jpg');
  });

  it('appends a synthetic cell for STL files', () => {
    const wrapper = mountAlbum({
      album: makeAlbum(['a']),
      stlFiles: [{ id: 's1', url: 'https://example.com/m.stl', fileName: 'm.stl' }],
    });
    expect(cells(wrapper)).toHaveLength(2);
  });
});
