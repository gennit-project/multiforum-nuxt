import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import LightboxControls from '@/components/discussion/detail/LightboxControls.vue';

// LightboxControls and its AddImageToFavorites child both import RequireAuth.

const mountControls = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(LightboxControls, {
    props: {
      lightboxIndex: 0,
      totalImages: 3,
      zoomLevel: 1.5,
      isZoomed: true,
      isPanelVisible: true,
      panelOnSide: true,
      currentImageUrl: 'https://example.com/i.png',
      ...props,
    },
    global: { stubs: { AddImageToFavorites: true } },
  });

// The report button lives in RequireAuth's #authenticated slot. Render that
// slot so the button is present, then the currentImageId/isStlFile v-if is what
// actually governs visibility.
const mountControlsAuthed = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(LightboxControls, {
    props: {
      lightboxIndex: 0,
      totalImages: 3,
      zoomLevel: 1.5,
      isZoomed: true,
      isPanelVisible: true,
      panelOnSide: true,
      currentImageUrl: 'https://example.com/i.png',
      ...props,
    },
    global: {
      stubs: {
        AddImageToFavorites: true,
        RequireAuth: { template: '<div><slot name="authenticated" /></div>' },
      },
    },
  });

describe('LightboxControls', () => {
  it.each([
    ['Close lightbox', 'close'],
    ['Zoom out', 'zoom-out'],
    ['Zoom in', 'zoom-in'],
    ['Reset zoom', 'reset-zoom'],
  ])('emits %s -> %s', async (label, event) => {
    const wrapper = mountControls();
    await wrapper.get(`[aria-label="${label}"]`).trigger('click');
    expect(wrapper.emitted(event)).toHaveLength(1);
  });

  it('emits toggle-panel from the panel visibility button', async () => {
    const wrapper = mountControls({ isPanelVisible: true });
    await wrapper.get('[aria-label="Hide panel"]').trigger('click');
    expect(wrapper.emitted('toggle-panel')).toHaveLength(1);
  });

  it('emits toggle-panel-position from the panel layout button', async () => {
    const wrapper = mountControls({ panelOnSide: true });
    await wrapper.get('[aria-label="Move panel to side"]').trigger('click');
    expect(wrapper.emitted('toggle-panel-position')).toHaveLength(1);
  });

  it('emits report-image from the report button', async () => {
    const wrapper = mountControlsAuthed({ currentImageId: 'img-1' });
    await wrapper.get('[aria-label="Report image"]').trigger('click');
    expect(wrapper.emitted('report-image')).toHaveLength(1);
  });

  it('hides the report button for STL files', () => {
    const wrapper = mountControlsAuthed({ currentImageId: 'img-1', isStlFile: true });
    expect(wrapper.find('[aria-label="Report image"]').exists()).toBe(false);
  });

  it('hides the report button when there is no image id', () => {
    const wrapper = mountControlsAuthed({ currentImageId: '' });
    expect(wrapper.find('[aria-label="Report image"]').exists()).toBe(false);
  });

  it('does not render the report button for unauthenticated users', () => {
    // The default RequireAuth stub renders only the has-auth (unauthenticated)
    // branch, so the report button — in the #authenticated slot — is absent.
    const wrapper = mountControls({ currentImageId: 'img-1' });
    expect(wrapper.find('[aria-label="Report image"]').exists()).toBe(false);
  });
});
