import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CarouselThumbnail from './CarouselThumbnail.vue';

const mountThumb = (props: Record<string, unknown>) =>
  mount(CarouselThumbnail, {
    props,
    global: {
      stubs: {},
    },
  });

describe('CarouselThumbnail', () => {
  it('renders a plain image for a regular url', () => {
    expect(
      mountThumb({ image: { url: 'a.png' } })
        .find('img')
        .attributes()
    ).toMatchObject({
      width: '80',
      height: '80',
      loading: 'lazy',
      decoding: 'async',
    });
  });

  // Thumbnails show a static tile; the interactive viewer loads only for the
  // selected item, so a thumbnail never pulls in the 3D runtime.
  it.each(['m.glb', 'm.stl'])('renders a static 3D tile for %s', (url) => {
    expect(
      mountThumb({ image: { url } })
        .find('[data-testid="model-preview-tile"]')
        .exists()
    ).toBe(true);
  });

  it('labels the 3D tile with the image alt text', () => {
    expect(
      mountThumb({ image: { url: 'm.glb', alt: 'A tiny warrior' } })
        .find('[role="img"]')
        .attributes('aria-label')
    ).toBe('A tiny warrior');
  });

  it('emits click when the thumbnail is clicked', async () => {
    const wrapper = mountThumb({ image: { url: 'a.png' } });
    await wrapper.find('div').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('applies the active border class when active', () => {
    expect(
      mountThumb({ image: { url: 'a.png' }, isActive: true }).classes()
    ).toContain('border-orange-500');
  });

  it('sizes the thumbnail from the size prop', () => {
    const wrapper = mountThumb({ image: { url: 'a.png' }, size: 120 });
    expect(wrapper.attributes('style')).toContain('120px');
  });
});
