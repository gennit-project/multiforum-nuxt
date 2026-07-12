import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import ModelViewer from '@/components/ModelViewer.vue';

// The component dynamically imports the heavy web component in onMounted.
vi.mock('@google/model-viewer', () => ({}));

// showFullscreenButton is a type-only boolean prop, so an absent value is cast
// to false and the button is hidden; enable it by default for these tests.
const mountViewer = (props: Record<string, unknown> = {}) =>
  mount(ModelViewer, {
    props: { modelUrl: 'https://x/model.glb', showFullscreenButton: true, ...props },
  });

const fullscreenButton = (w: ReturnType<typeof mount>) =>
  w.find('button[aria-label="View 3D model in fullscreen"]');
const closeButton = (w: ReturnType<typeof mount>) =>
  w.find('button[aria-label="Close fullscreen 3D model viewer"]');

beforeEach(() => {
  document.body.style.overflow = '';
});

describe('ModelViewer rendering', () => {
  it('shows the model when a url is provided', () => {
    const wrapper = mountViewer();

    expect(wrapper.find('model-viewer').exists()).toBe(true);
  });

  it('omits the model when there is no url', () => {
    const wrapper = mountViewer({ modelUrl: '' });

    expect(wrapper.find('model-viewer').exists()).toBe(false);
  });

  it('shows the fullscreen button when enabled', () => {
    const wrapper = mountViewer({ showFullscreenButton: true });

    expect(fullscreenButton(wrapper).exists()).toBe(true);
  });

  it('hides the fullscreen button when disabled', () => {
    const wrapper = mountViewer({ showFullscreenButton: false });

    expect(fullscreenButton(wrapper).exists()).toBe(false);
  });
});

describe('ModelViewer fullscreen', () => {
  it('opens the fullscreen modal', async () => {
    const wrapper = mountViewer();

    await fullscreenButton(wrapper).trigger('click');

    expect(closeButton(wrapper).exists()).toBe(true);
  });

  it('exposes the fullscreen viewer as a named modal dialog', async () => {
    const wrapper = mountViewer();

    await fullscreenButton(wrapper).trigger('click');
    const dialog = wrapper.get('[role="dialog"]');

    expect({
      modal: dialog.attributes('aria-modal'),
      name: wrapper.get(`#${dialog.attributes('aria-labelledby')}`).text(),
    }).toEqual({
      modal: 'true',
      name: 'Fullscreen 3D model viewer',
    });
  });

  it('locks body scroll while fullscreen', async () => {
    const wrapper = mountViewer();

    await fullscreenButton(wrapper).trigger('click');

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('closes the fullscreen modal via the close button', async () => {
    const wrapper = mountViewer();
    await fullscreenButton(wrapper).trigger('click');

    await closeButton(wrapper).trigger('click');

    expect(closeButton(wrapper).exists()).toBe(false);
  });

  it('restores body scroll when closed', async () => {
    const wrapper = mountViewer();
    await fullscreenButton(wrapper).trigger('click');

    await closeButton(wrapper).trigger('click');

    expect(document.body.style.overflow).toBe('');
  });

  it('preserves an existing body overflow value', async () => {
    document.body.style.overflow = 'clip';
    const wrapper = mountViewer();
    await fullscreenButton(wrapper).trigger('click');

    await closeButton(wrapper).trigger('click');

    expect(document.body.style.overflow).toBe('clip');
  });

  it('closes fullscreen on the Escape key', async () => {
    const wrapper = mountViewer();
    await fullscreenButton(wrapper).trigger('click');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(closeButton(wrapper).exists()).toBe(false);
  });

  it('ignores other keys', async () => {
    const wrapper = mountViewer();
    await fullscreenButton(wrapper).trigger('click');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await wrapper.vm.$nextTick();

    expect(closeButton(wrapper).exists()).toBe(true);
  });

  it('returns focus to the fullscreen trigger after closing', async () => {
    const wrapper = mount(ModelViewer, {
      attachTo: document.body,
      props: {
        modelUrl: 'https://x/model.glb',
        showFullscreenButton: true,
      },
    });
    const trigger = fullscreenButton(wrapper);
    (trigger.element as HTMLButtonElement).focus();
    await trigger.trigger('click');

    await closeButton(wrapper).trigger('click');

    expect(document.activeElement).toBe(trigger.element);
    wrapper.unmount();
  });
});
