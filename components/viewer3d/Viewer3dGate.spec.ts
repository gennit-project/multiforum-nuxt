import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import Viewer3dGate from '@/components/viewer3d/Viewer3dGate.vue';

const mountGate = (props: Record<string, unknown> = {}) =>
  mount(Viewer3dGate, {
    props: { label: 'Dragon', ...props },
    slots: { default: '<div data-testid="slotted-viewer" />' },
  });

const poster = (w: ReturnType<typeof mountGate>) =>
  w.find('[data-testid="load-3d-viewer"]');

describe('Viewer3dGate', () => {
  it('does not render the slotted viewer before activation', () => {
    expect(mountGate().find('[data-testid="slotted-viewer"]').exists()).toBe(
      false
    );
  });

  it('renders a keyboard-reachable button as the poster', () => {
    expect(poster(mountGate()).element.tagName).toBe('BUTTON');
  });

  it('names the poster button after the model', () => {
    expect(poster(mountGate()).attributes('aria-label')).toBe(
      'Load interactive 3D model: Dragon'
    );
  });

  it('renders the slotted viewer after the poster is clicked', async () => {
    const wrapper = mountGate();

    await poster(wrapper).trigger('click');

    expect(wrapper.find('[data-testid="slotted-viewer"]').exists()).toBe(true);
  });

  it('removes the poster once activated', async () => {
    const wrapper = mountGate();

    await poster(wrapper).trigger('click');

    expect(poster(wrapper).exists()).toBe(false);
  });

  it('emits activate once when clicked', async () => {
    const wrapper = mountGate();

    await poster(wrapper).trigger('click');

    expect(wrapper.emitted('activate')).toHaveLength(1);
  });

  it('does not let the click bubble to a parent opening a lightbox', async () => {
    let parentClicks = 0;
    const wrapper = mount(
      {
        components: { Viewer3dGate },
        methods: {
          bump() {
            parentClicks += 1;
          },
        },
        template: '<div @click="bump"><Viewer3dGate label="x" /></div>',
      },
      { attachTo: document.body }
    );

    await wrapper.find('[data-testid="load-3d-viewer"]').trigger('click');

    expect(parentClicks).toBe(0);
  });

  it('hides the visible text in compact mode', () => {
    expect(mountGate({ compact: true }).text()).toBe('');
  });
});
