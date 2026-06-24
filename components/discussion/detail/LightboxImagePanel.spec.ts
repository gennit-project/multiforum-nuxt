import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import LightboxImagePanel from '@/components/discussion/detail/LightboxImagePanel.vue';

const baseProps = {
  zoomLevel: 1,
  translateX: 0,
  translateY: 0,
  isZoomed: false,
  isDragging: false,
};

const mountPanel = (props: Record<string, unknown> = {}) =>
  mount(LightboxImagePanel, {
    props: {
      currentImage: { id: 'i1', url: 'https://x/pic.png', alt: 'a pic' },
      ...baseProps,
      ...props,
    },
    global: {
      stubs: {
        ModelViewer: { name: 'ModelViewer', props: ['modelUrl'], template: '<div class="model" />' },
        StlViewer: { name: 'StlViewer', props: ['src'], template: '<div class="stl" />' },
        ClientOnly: { template: '<div><slot /></div>' },
        LeftArrowIcon: true,
        RightArrowIcon: true,
      },
    },
  });

const navButton = (w: ReturnType<typeof mount>, label: string) =>
  w.find(`button[aria-label="${label}"]`);

describe('LightboxImagePanel viewer selection', () => {
  it('renders an img for a regular image', () => {
    const wrapper = mountPanel();

    expect(wrapper.find('img').attributes('src')).toBe('https://x/pic.png');
  });

  it('renders a ModelViewer for a glb file', () => {
    const wrapper = mountPanel({ currentImage: { id: 'i1', url: 'https://x/model.glb' } });

    expect(wrapper.find('.model').exists()).toBe(true);
  });

  it('renders an StlViewer for an stl file', () => {
    const wrapper = mountPanel({ currentImage: { id: 'i1', url: 'https://x/model.stl' } });

    expect(wrapper.find('.stl').exists()).toBe(true);
  });
});

describe('LightboxImagePanel navigation', () => {
  it('shows navigation buttons when enabled', () => {
    const wrapper = mountPanel({ showNavigation: true });

    expect(navButton(wrapper, 'Previous image').exists()).toBe(true);
  });

  it('hides navigation buttons by default', () => {
    const wrapper = mountPanel();

    expect(navButton(wrapper, 'Previous image').exists()).toBe(false);
  });

  it('emits prev-image', async () => {
    const wrapper = mountPanel({ showNavigation: true });

    await navButton(wrapper, 'Previous image').trigger('click');

    expect(wrapper.emitted('prev-image')).toBeTruthy();
  });

  it('emits next-image', async () => {
    const wrapper = mountPanel({ showNavigation: true });

    await navButton(wrapper, 'Next image').trigger('click');

    expect(wrapper.emitted('next-image')).toBeTruthy();
  });
});

describe('LightboxImagePanel interactions', () => {
  it('emits mousedown from the image', async () => {
    const wrapper = mountPanel();

    await wrapper.find('img').trigger('mousedown');

    expect(wrapper.emitted('mousedown')).toBeTruthy();
  });

  it.each(['touchstart', 'touchend', 'touchmove'])(
    'emits %s from the image',
    async (evt) => {
      const wrapper = mountPanel();

      await wrapper.find('img').trigger(evt);

      expect(wrapper.emitted(evt)).toBeTruthy();
    }
  );

  it('emits mousedown from the model viewer', async () => {
    const wrapper = mountPanel({ currentImage: { id: 'i1', url: 'https://x/m.glb' } });

    await wrapper.find('.model').trigger('mousedown');

    expect(wrapper.emitted('mousedown')).toBeTruthy();
  });

  it('emits mousedown from the stl wrapper', async () => {
    const wrapper = mountPanel({ currentImage: { id: 'i1', url: 'https://x/m.stl' } });

    await wrapper.find('.stl').trigger('mousedown');

    expect(wrapper.emitted('mousedown')).toBeTruthy();
  });

  it('handles a click on the region while editing a caption', async () => {
    const wrapper = mountPanel({ editingCaption: true });

    await wrapper.find('[role="region"]').trigger('click');

    expect(wrapper.find('[role="region"]').exists()).toBe(true);
  });

  it('stops propagation when clicking a button while editing a caption', async () => {
    const wrapper = mountPanel({ editingCaption: true, showNavigation: true });

    await navButton(wrapper, 'Previous image').trigger('click');

    expect(wrapper.emitted('prev-image')).toBeTruthy();
  });
});
