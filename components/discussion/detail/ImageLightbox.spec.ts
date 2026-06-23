import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ImageLightbox from '@/components/discussion/detail/ImageLightbox.vue';

// Only the caption mutation talks to GraphQL; the zoom/navigation/swipe
// composables are pure state and are exercised for real.
const h = vi.hoisted(() => ({ updateImage: undefined as unknown }));
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({ mutate: h.updateImage, loading: ref(false) }),
}));

const childStub = (name: string, props: string[], emits: string[]) => ({
  name,
  props,
  emits,
  template: '<div />',
});

const images = [
  { id: 'img1', url: 'u1', caption: 'cap1', Uploader: { username: 'alice' } },
  { id: 'img2', url: 'u2', caption: 'cap2' },
];

const mountLightbox = (props: Record<string, unknown> = {}) =>
  mount(ImageLightbox, {
    props: {
      orderedImages: images,
      isLoggedInAuthor: true,
      ...props,
    },
    global: {
      stubs: {
        LightboxControls: childStub(
          'LightboxControls',
          ['lightboxIndex', 'zoomLevel', 'isZoomed', 'currentImageId'],
          [
            'close',
            'zoom-in',
            'zoom-out',
            'reset-zoom',
            'toggle-panel',
            'toggle-panel-position',
            'report-image',
          ]
        ),
        LightboxImagePanel: childStub(
          'LightboxImagePanel',
          ['currentImage', 'zoomLevel', 'isZoomed', 'isDragging'],
          ['prev-image', 'next-image', 'mousedown', 'touchstart', 'touchend', 'touchmove']
        ),
        LightboxInfoPanel: childStub(
          'LightboxInfoPanel',
          ['currentImage', 'isEditing', 'editingCaption'],
          ['start-editing', 'update-caption', 'save-caption', 'cancel-editing', 'close-panel']
        ),
        BrokenRulesModal: childStub(
          'BrokenRulesModal',
          ['open', 'imageId'],
          ['close', 'report-submitted-successfully']
        ),
        Notification: childStub('Notification', ['show', 'title'], ['close-notification']),
      },
    },
  });

const controls = (wrapper: ReturnType<typeof mount>) =>
  wrapper.getComponent({ name: 'LightboxControls' });
const infoPanel = (wrapper: ReturnType<typeof mount>) =>
  wrapper.getComponent({ name: 'LightboxInfoPanel' });
const reportModal = (wrapper: ReturnType<typeof mount>) =>
  wrapper.getComponent({ name: 'BrokenRulesModal' });
const imagePanel = (wrapper: ReturnType<typeof mount>) =>
  wrapper.getComponent({ name: 'LightboxImagePanel' });

beforeEach(() => {
  h.updateImage = vi.fn().mockResolvedValue({});
});

describe('ImageLightbox current image', () => {
  it('shows the image at the initial index', () => {
    const wrapper = mountLightbox({ initialIndex: 1 });

    expect(controls(wrapper).props('currentImageId')).toBe('img2');
  });

  it('advances to the next image on ArrowRight', async () => {
    const wrapper = mountLightbox();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await wrapper.vm.$nextTick();

    expect(controls(wrapper).props('currentImageId')).toBe('img2');
  });

  it('wraps to the previous image on ArrowLeft', async () => {
    const wrapper = mountLightbox();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    await wrapper.vm.$nextTick();

    expect(controls(wrapper).props('currentImageId')).toBe('img2');
  });

  it('navigates via the image panel next-image event', async () => {
    const wrapper = mountLightbox();

    await wrapper.getComponent({ name: 'LightboxImagePanel' }).vm.$emit('next-image');

    expect(controls(wrapper).props('currentImageId')).toBe('img2');
  });
});

describe('ImageLightbox zoom', () => {
  it('marks the view as zoomed after zooming in', async () => {
    const wrapper = mountLightbox();

    await controls(wrapper).vm.$emit('zoom-in');

    expect(controls(wrapper).props('isZoomed')).toBe(true);
  });

  it('resets zoom with the 0 key', async () => {
    const wrapper = mountLightbox();
    await controls(wrapper).vm.$emit('zoom-in');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '0' }));
    await wrapper.vm.$nextTick();

    expect(controls(wrapper).props('isZoomed')).toBe(false);
  });
});

describe('ImageLightbox keyboard and layout', () => {
  it('toggles the info panel with the "i" key', async () => {
    const wrapper = mountLightbox();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'i' }));
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: 'LightboxInfoPanel' }).exists()).toBe(
      false
    );
  });

  it('zooms in with the "+" key', async () => {
    const wrapper = mountLightbox();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '+' }));
    await wrapper.vm.$nextTick();

    expect(controls(wrapper).props('isZoomed')).toBe(true);
  });

  it('keeps a zoomed view after a single zoom-out from a deeper zoom', async () => {
    const wrapper = mountLightbox();
    await controls(wrapper).vm.$emit('zoom-in');
    await controls(wrapper).vm.$emit('zoom-in');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '-' }));
    await wrapper.vm.$nextTick();

    expect(controls(wrapper).props('isZoomed')).toBe(true);
  });

  it('flips the panel layout on toggle-panel-position', async () => {
    const wrapper = mountLightbox();

    await controls(wrapper).vm.$emit('toggle-panel-position');

    expect(wrapper.get('[role="dialog"]').classes()).toContain('flex-row');
  });

  it('does not respond to navigation keys while editing a caption', async () => {
    const wrapper = mountLightbox();
    await infoPanel(wrapper).vm.$emit('start-editing');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await wrapper.vm.$nextTick();

    expect(controls(wrapper).props('currentImageId')).toBe('img1');
  });
});

describe('ImageLightbox touch gestures', () => {
  it('advances to the next image on a left swipe', async () => {
    const wrapper = mountLightbox();

    await imagePanel(wrapper).vm.$emit('touchstart', {
      touches: [{ clientX: 300 }],
    });
    await imagePanel(wrapper).vm.$emit('touchend', {
      changedTouches: [{ clientX: 0 }],
    });

    expect(controls(wrapper).props('currentImageId')).toBe('img2');
  });

  it('starts dragging when the image is pressed while zoomed', async () => {
    const wrapper = mountLightbox();
    await controls(wrapper).vm.$emit('zoom-in');

    await imagePanel(wrapper).vm.$emit('mousedown', {
      button: 0,
      clientX: 10,
      clientY: 10,
      preventDefault: () => {},
    });

    expect(imagePanel(wrapper).props('isDragging')).toBe(true);
  });
});

describe('ImageLightbox close', () => {
  it('emits close when the controls close button is used', async () => {
    const wrapper = mountLightbox();

    await controls(wrapper).vm.$emit('close');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits close on the Escape key', async () => {
    const wrapper = mountLightbox();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});

describe('ImageLightbox info panel', () => {
  it('hides the info panel when toggled off', async () => {
    const wrapper = mountLightbox();

    await controls(wrapper).vm.$emit('toggle-panel');

    expect(wrapper.findComponent({ name: 'LightboxInfoPanel' }).exists()).toBe(
      false
    );
  });

  it('enters caption-editing mode on start-editing', async () => {
    const wrapper = mountLightbox();

    await infoPanel(wrapper).vm.$emit('start-editing');

    expect(infoPanel(wrapper).props('isEditing')).toBe(true);
  });

  it('saves the caption via the update mutation', async () => {
    const wrapper = mountLightbox();
    await infoPanel(wrapper).vm.$emit('start-editing');

    await infoPanel(wrapper).vm.$emit('update-caption', 'new caption');
    await infoPanel(wrapper).vm.$emit('save-caption');

    expect(h.updateImage).toHaveBeenCalledWith({
      imageId: 'img1',
      caption: 'new caption',
    });
  });

  it('emits album-updated after a successful caption save', async () => {
    const wrapper = mountLightbox();
    await infoPanel(wrapper).vm.$emit('start-editing');

    await infoPanel(wrapper).vm.$emit('save-caption');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('album-updated')).toBeTruthy();
  });

  it('exits editing mode on cancel', async () => {
    const wrapper = mountLightbox();
    await infoPanel(wrapper).vm.$emit('start-editing');

    await infoPanel(wrapper).vm.$emit('cancel-editing');

    expect(infoPanel(wrapper).props('isEditing')).toBe(false);
  });
});

describe('ImageLightbox reporting', () => {
  it('opens the report modal from the controls', async () => {
    const wrapper = mountLightbox();

    await controls(wrapper).vm.$emit('report-image');

    expect(reportModal(wrapper).props('open')).toBe(true);
  });

  it('shows the success notification after a report is submitted', async () => {
    const wrapper = mountLightbox();
    await controls(wrapper).vm.$emit('report-image');

    await reportModal(wrapper).vm.$emit('report-submitted-successfully');

    expect(
      wrapper.getComponent({ name: 'Notification' }).props('show')
    ).toBe(true);
  });

  it('dismisses the success notification', async () => {
    const wrapper = mountLightbox();
    await controls(wrapper).vm.$emit('report-image');
    await reportModal(wrapper).vm.$emit('report-submitted-successfully');

    await wrapper
      .getComponent({ name: 'Notification' })
      .vm.$emit('close-notification');

    expect(
      wrapper.getComponent({ name: 'Notification' }).props('show')
    ).toBe(false);
  });
});
