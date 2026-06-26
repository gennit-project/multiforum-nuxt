import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CarouselThumbnail from './CarouselThumbnail.vue';

const mountThumb = (props: Record<string, unknown>) =>
  mount(CarouselThumbnail, {
    props,
    global: {
      stubs: {
        ClientOnly: { template: '<div><slot /></div>' },
        ModelViewer: { template: '<div class="model" />' },
        StlViewer: { template: '<div class="stl" />' },
      },
    },
  });

describe('CarouselThumbnail', () => {
  it('renders a plain image for a regular url', () => {
    expect(
      mountThumb({ image: { url: 'a.png' } }).find('img').exists()
    ).toBe(true);
  });

  it('renders the model viewer for a glb url', () => {
    expect(
      mountThumb({ image: { url: 'm.glb' } }).find('.model').exists()
    ).toBe(true);
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
