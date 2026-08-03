import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import LightgalleryAlbum from '@/components/discussion/detail/LightgalleryAlbum.vue';
import type { Album } from '@/__generated__/graphql';

const album = (count: number) =>
  ({
    Images: Array.from({ length: count }, (_, i) => ({
      id: `i${i}`,
      url: `https://x/${i}.png`,
      alt: `image ${i}`,
    })),
  }) as unknown as Album;

const mountAlbum = (props: Record<string, unknown> = {}) =>
  mount(LightgalleryAlbum, {
    props: { album: album(6), ...props },
    global: {
      stubs: {
        LeftArrowIcon: true,
        RightArrowIcon: true,
        VueEasyLightbox: {
          name: 'VueEasyLightbox',
          props: ['visible', 'imgs', 'index'],
          emits: ['hide'],
          template: '<div data-testid="lightbox" />',
        },
      },
    },
  });

const thumbnails = (w: ReturnType<typeof mount>) => w.findAll('.grid-cols-4 > button');
const rightArrow = (w: ReturnType<typeof mount>) =>
  w.find('button[aria-label="Scroll thumbnails right"]');
const leftArrow = (w: ReturnType<typeof mount>) =>
  w.find('button[aria-label="Scroll thumbnails left"]');

describe('LightgalleryAlbum grid format', () => {
  it('renders all images in grid format', () => {
    const wrapper = mountAlbum({ carouselFormat: false });

    expect(wrapper.findAll('img')).toHaveLength(6);
  });

  it('opens the selected image in the lightbox', async () => {
    const wrapper = mountAlbum({ carouselFormat: false });

    await wrapper.findAll('button')[2].trigger('click');

    expect(wrapper.getComponent({ name: 'VueEasyLightbox' }).props()).toMatchObject({
      visible: true,
      index: 2,
      imgs: Array.from({ length: 6 }, (_, i) => `https://x/${i}.png`),
    });
  });

  it('closes the lightbox when it emits hide', async () => {
    const wrapper = mountAlbum({ carouselFormat: false });
    await wrapper.findAll('button')[0].trigger('click');

    await wrapper.getComponent({ name: 'VueEasyLightbox' }).vm.$emit('hide');

    expect(wrapper.find('[data-testid="lightbox"]').exists()).toBe(false);
  });
});

describe('LightgalleryAlbum carousel thumbnails', () => {
  it('shows at most four thumbnails', () => {
    const wrapper = mountAlbum({ carouselFormat: true });

    expect(thumbnails(wrapper)).toHaveLength(4);
  });

  it('hides the thumbnail nav for a single image', () => {
    const wrapper = mountAlbum({ carouselFormat: true, album: album(1) });

    expect(rightArrow(wrapper).exists()).toBe(false);
  });

  it('highlights the active thumbnail', () => {
    const wrapper = mountAlbum({ carouselFormat: true });

    expect(thumbnails(wrapper)[0].classes()).toContain('border-orange-500');
  });

  it('changes the active image on thumbnail click', async () => {
    const wrapper = mountAlbum({ carouselFormat: true });

    await thumbnails(wrapper)[2].trigger('click');

    expect(thumbnails(wrapper)[2].classes()).toContain('border-orange-500');
  });
});

describe('LightgalleryAlbum thumbnail scrolling', () => {
  it('disables the left arrow at the start', () => {
    const wrapper = mountAlbum({ carouselFormat: true });

    expect(leftArrow(wrapper).attributes('disabled')).toBeDefined();
  });

  it('enables the right arrow when more thumbnails exist', () => {
    const wrapper = mountAlbum({ carouselFormat: true });

    expect(rightArrow(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('scrolls the thumbnails right', async () => {
    const wrapper = mountAlbum({ carouselFormat: true });

    await rightArrow(wrapper).trigger('click');

    // After scrolling, the first visible thumbnail is the second image.
    expect(wrapper.find('.grid-cols-4 img').attributes('alt')).toContain('2');
  });

  it('enables the left arrow after scrolling', async () => {
    const wrapper = mountAlbum({ carouselFormat: true });

    await rightArrow(wrapper).trigger('click');

    expect(leftArrow(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('disables the right arrow at the end', async () => {
    const wrapper = mountAlbum({ carouselFormat: true });
    await rightArrow(wrapper).trigger('click');

    await rightArrow(wrapper).trigger('click');

    expect(rightArrow(wrapper).attributes('disabled')).toBeDefined();
  });
});
