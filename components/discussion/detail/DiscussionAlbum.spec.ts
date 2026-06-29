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
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ({ value: 'alice' }),
}));

const stubs = {
  ModelViewer: { template: '<div class="model-viewer-stub" />' },
  StlViewer: { template: '<div class="stl-viewer-stub" />' },
  CarouselThumbnail: { template: '<div />' },
  ClientOnly: { template: '<div><slot /></div>' },
  ImageLightbox: {
    template: '<button class="lightbox-stub" @click="$emit(\'close\')" />',
  },
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

describe('DiscussionAlbum — lightbox', () => {
  // The lightbox is teleported to <body>, so query the document, not the wrapper.
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.querySelectorAll('.lightbox-stub').forEach((el) => el.remove());
  });

  it('opens the lightbox when a grid cell is clicked', async () => {
    const wrapper = mountAlbum();
    await wrapper.findAll('.grid-cols-3 > div')[0].trigger('click');

    expect(document.body.querySelector('.lightbox-stub')).not.toBeNull();
  });

  it('opens the lightbox on mount when startInLightbox is set', async () => {
    const wrapper = mountAlbum({ startInLightbox: true });
    await wrapper.vm.$nextTick();

    expect(document.body.querySelector('.lightbox-stub')).not.toBeNull();
  });

  it('emits close-lightbox when the lightbox is closed', async () => {
    const wrapper = mountAlbum({ startInLightbox: true });
    await wrapper.vm.$nextTick();
    (document.body.querySelector('.lightbox-stub') as HTMLElement).click();
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('close-lightbox')).toBeTruthy();
  });
});

describe('DiscussionAlbum — carousel navigation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('advances to the next image', async () => {
    const wrapper = mountAlbum({ carouselFormat: true });
    await wrapper.get('[aria-label="Next image"]').trigger('click');

    expect(wrapper.text()).toContain('2 of 3');
  });

  it('wraps to the last image when going left from the first', async () => {
    const wrapper = mountAlbum({ carouselFormat: true });
    await wrapper.get('[aria-label="Previous image"]').trigger('click');

    expect(wrapper.text()).toContain('3 of 3');
  });

  it('navigates by swiping the image container', async () => {
    const wrapper = mountAlbum({ carouselFormat: true });
    const container = wrapper.find('.touch-pan-x');
    await container.trigger('touchstart', { touches: [{ clientX: 200 }] });
    await container.trigger('touchend', { changedTouches: [{ clientX: 100 }] });

    expect(wrapper.text()).toContain('2 of 3');
  });

  it('renders the taller main image in download expanded view', () => {
    const wrapper = mountAlbum({
      carouselFormat: true,
      expandedView: true,
      downloadMode: true,
    });

    expect(wrapper.find('.touch-pan-x').attributes('style')).toContain('500px');
  });
});
