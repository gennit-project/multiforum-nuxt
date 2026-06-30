import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ExpandableImage from '@/components/ExpandableImage.vue';

const mountImage = () =>
  mount(ExpandableImage, {
    props: {
      src: 'https://example.test/image.png',
      alt: 'Example image',
      rounded: true,
    },
    global: {
      stubs: {
        VueEasyLightbox: {
          name: 'VueEasyLightbox',
          props: ['visible', 'imgs', 'index'],
          emits: ['hide'],
          template: '<div data-testid="lightbox" />',
        },
      },
    },
  });

describe('ExpandableImage', () => {
  it('renders the image with alt text and rounded class', () => {
    const wrapper = mountImage();

    expect({
      src: wrapper.get('img').attributes('src'),
      alt: wrapper.get('img').attributes('alt'),
      rounded: wrapper.get('img').classes('rounded-full'),
    }).toEqual({
      src: 'https://example.test/image.png',
      alt: 'Example image',
      rounded: true,
    });
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
