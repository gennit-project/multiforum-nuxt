import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ExpandableImage from '@/components/ExpandableImage.vue';

const mountImage = () =>
  mount(ExpandableImage, {
    props: {
      src: 'https://example.test/image.png',
      alt: 'Example image',
      rounded: true,
      fullWidth: true,
      width: 640,
      height: 360,
      sizes: '100vw',
      loading: 'eager',
      fetchpriority: 'high',
    },
    global: {
      stubs: {
        VueEasyLightbox: {
          name: 'VueEasyLightbox',
          props: ['visible', 'imgs', 'index'],
          emits: ['hide'],
          template: '<div data-testid="lightbox" />',
        },
        NuxtImg: {
          props: [
            'src',
            'alt',
            'width',
            'height',
            'sizes',
            'loading',
            'decoding',
            'fetchpriority',
          ],
          template: '<img v-bind="$props" />',
        },
      },
    },
  });

describe('ExpandableImage', () => {
  it('renders the image with optimization hints and rounded class', () => {
    const wrapper = mountImage();

    expect(wrapper.get('img').attributes()).toMatchObject({
      src: 'https://example.test/image.png',
      alt: 'Example image',
      width: '640',
      height: '360',
      loading: 'eager',
      fetchpriority: 'high',
    });
    expect(wrapper.get('img').classes()).toEqual(
      expect.arrayContaining(['rounded-full', 'w-full'])
    );
  });

  it('opens and closes the lightbox for the image', async () => {
    const wrapper = mountImage();

    await wrapper.get('img').trigger('click');

    expect(wrapper.getComponent({ name: 'VueEasyLightbox' }).props()).toMatchObject({
      visible: true,
      imgs: ['https://example.test/image.png'],
      index: 0,
    });

    await wrapper.getComponent({ name: 'VueEasyLightbox' }).vm.$emit('hide');

    expect(wrapper.find('[data-testid="lightbox"]').exists()).toBe(false);
  });
});
