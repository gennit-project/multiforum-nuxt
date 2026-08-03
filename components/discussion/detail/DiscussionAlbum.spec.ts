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
  CarouselThumbnail: { name: 'CarouselThumbnail', template: '<div />' },
  ClientOnly: { template: '<div><slot /></div>' },
  ImageLightbox: {
    template: '<button class="lightbox-stub" @click="$emit(\'close\')" />',
  },
  TextEditor: { name: 'TextEditor', template: '<div />' },
  SaveButton: { name: 'SaveButton', template: '<button />' },
  CancelButton: { name: 'CancelButton', template: '<button />' },
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
    const srcs = cells(wrapper).map((cell) =>
      cell.find('img').attributes('src')
    );
    expect(srcs).toEqual([
      'https://example.com/a.jpg',
      'https://example.com/b.jpg',
    ]);
  });

  it('orders the cells according to imageOrder', () => {
    const wrapper = mountAlbum({
      album: makeAlbum(['a', 'b', 'c'], ['c', 'a', 'b']),
    });
    const firstImg = cells(wrapper)[0].find('img');
    expect(firstImg.attributes('src')).toContain('/c.jpg');
  });

  it('appends a synthetic cell for STL files', () => {
    const wrapper = mountAlbum({
      album: makeAlbum(['a']),
      stlFiles: [
        { id: 's1', url: 'https://example.com/m.stl', fileName: 'm.stl' },
      ],
    });
    expect(cells(wrapper)).toHaveLength(2);
  });

  it('renders a model viewer for GLB images', () => {
    const wrapper = mountAlbum({
      album: {
        ...makeAlbum(['model']),
        Images: [
          {
            id: 'model',
            url: 'https://example.com/model.glb',
            alt: 'alt-model',
            caption: '',
            __typename: 'Image',
          },
        ],
      } as Album,
    });

    expect(wrapper.find('.model-viewer-stub').exists()).toBe(true);
  });

  it('renders an STL viewer for STL images', () => {
    const wrapper = mountAlbum({
      album: makeAlbum([]),
      stlFiles: [
        { id: 's1', url: 'https://example.com/m.stl', fileName: 'm.stl' },
      ],
    });

    expect(wrapper.find('.stl-viewer-stub').exists()).toBe(true);
  });

  it('enters caption edit mode and saves the caption', async () => {
    const wrapper = mountAlbum();

    await wrapper.get('span[role="button"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent({ name: 'TextEditor' }).exists()).toBe(true);

    await wrapper
      .findComponent({ name: 'TextEditor' })
      .vm.$emit('update', 'new caption');
    await wrapper.findComponent({ name: 'SaveButton' }).trigger('click');

    expect(wrapper.emitted('album-updated')).toBeTruthy();
  });

  it('cancels caption editing', async () => {
    const wrapper = mountAlbum({
      album: makeAlbum(['a']),
      discussionAuthor: 'alice',
    });

    await wrapper.get('span[role="button"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.findComponent({ name: 'CancelButton' }).trigger('click');

    expect(wrapper.findComponent({ name: 'TextEditor' }).exists()).toBe(false);
  });

  it.each(['enter', 'space'])(
    'enters caption editing with the %s key',
    async (key) => {
      const wrapper = mountAlbum({
        album: {
          ...makeAlbum(['a']),
          Images: [{ ...makeImage('a'), caption: 'Existing caption' }],
        } as Album,
      });
      await wrapper.get('span[role="button"]').trigger(`keydown.${key}`);
      expect(wrapper.findComponent({ name: 'TextEditor' }).exists()).toBe(true);
    }
  );
});

describe('DiscussionAlbum — lightbox', () => {
  // The lightbox is teleported to <body>, so query the document, not the wrapper.
  beforeEach(() => {
    vi.clearAllMocks();
    document.body
      .querySelectorAll('.lightbox-stub')
      .forEach((el) => el.remove());
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

  const carousel = (wrapper: ReturnType<typeof mountAlbum>) =>
    wrapper.get('[data-testid="discussion-album-carousel"]');

  it('allows native vertical scrolling over the carousel', () => {
    expect(carousel(mountAlbum({ carouselFormat: true })).classes()).toContain(
      'touch-pan-y'
    );
  });

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

  it('moves left without wrapping from a later image', async () => {
    const wrapper = mountAlbum({ carouselFormat: true });
    await wrapper.get('[aria-label="Next image"]').trigger('click');
    await wrapper.get('[aria-label="Previous image"]').trigger('click');
    expect(wrapper.text()).toContain('1 of 3');
  });

  it('wraps to the first image after advancing past the end', async () => {
    const wrapper = mountAlbum({ carouselFormat: true });
    const next = wrapper.get('[aria-label="Next image"]');
    await next.trigger('click');
    await next.trigger('click');
    await next.trigger('click');
    expect(wrapper.text()).toContain('1 of 3');
  });

  it('navigates by swiping the image container', async () => {
    const wrapper = mountAlbum({ carouselFormat: true });
    const container = carousel(wrapper);
    await container.trigger('touchstart', { touches: [{ clientX: 200 }] });
    await container.trigger('touchend', { changedTouches: [{ clientX: 100 }] });

    expect(wrapper.text()).toContain('2 of 3');
  });

  it('navigates backward on a right swipe', async () => {
    const wrapper = mountAlbum({ carouselFormat: true });
    const container = carousel(wrapper);
    await container.trigger('touchstart', { touches: [{ clientX: 100 }] });
    await container.trigger('touchend', { changedTouches: [{ clientX: 200 }] });
    expect(wrapper.text()).toContain('3 of 3');
  });

  it('selects carousel images from both thumbnail layouts', async () => {
    const compact = mountAlbum({ carouselFormat: true, showThumbnails: true });
    await compact
      .findAllComponents({ name: 'CarouselThumbnail' })[1]
      .vm.$emit('click');
    const expanded = mountAlbum({ carouselFormat: true, expandedView: true });
    await expanded
      .findAllComponents({ name: 'CarouselThumbnail' })[2]
      .vm.$emit('click');
    expect([compact.text(), expanded.text()]).toEqual([
      expect.stringContaining('2 of 3'),
      expect.stringContaining('3 of 3'),
    ]);
  });

  it('opens the lightbox from the active carousel image', async () => {
    const wrapper = mountAlbum({ carouselFormat: true });
    await carousel(wrapper).get('div.h-full').trigger('click');
    expect(document.body.querySelector('.lightbox-stub')).not.toBeNull();
  });

  it('renders the taller main image in download expanded view', () => {
    const wrapper = mountAlbum({
      carouselFormat: true,
      expandedView: true,
      downloadMode: true,
    });

    expect(carousel(wrapper).attributes('style')).toContain('500px');
  });
});
