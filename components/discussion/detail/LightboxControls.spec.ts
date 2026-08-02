import { afterEach, describe, it, expect, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
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

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
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

  // The report button lives in RequireAuth's #has-auth slot, which the default
  // test stub renders; currentImageId/isStlFile then govern visibility.
  it('emits report-image from the report button', async () => {
    const wrapper = mountControls({ currentImageId: 'img-1' });
    await wrapper.get('[aria-label="Report image"]').trigger('click');
    expect(wrapper.emitted('report-image')).toHaveLength(1);
  });

  it('hides the report button for STL files', () => {
    const wrapper = mountControls({ currentImageId: 'img-1', isStlFile: true });
    expect(wrapper.find('[aria-label="Report image"]').exists()).toBe(false);
  });

  it('hides the report button when there is no image id', () => {
    const wrapper = mountControls({ currentImageId: '' });
    expect(wrapper.find('[aria-label="Report image"]').exists()).toBe(false);
  });

  it('downloads the current image and releases its blob URL', async () => {
    vi.useFakeTimers();
    const blob = new Blob(['image']);
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ blob: () => Promise.resolve(blob) });
    const createObjectURL = vi.fn().mockReturnValue('blob:test-image');
    const revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });
    const wrapper = mountControls({
      currentImageUrl: 'https://example.com/files/cat.png',
    });

    await wrapper.get('[aria-label="Download image"]').trigger('click');
    await flushPromises();
    vi.advanceTimersByTime(100);

    expect({
      requestedUrl: fetchMock.mock.calls[0],
      createdFrom: createObjectURL.mock.calls[0],
      releasedUrl: revokeObjectURL.mock.calls[0],
      clickCount: click.mock.calls.length,
      remainingLinks: document.body.querySelectorAll('a[download]').length,
    }).toEqual({
      requestedUrl: ['https://example.com/files/cat.png'],
      createdFrom: [blob],
      releasedUrl: ['blob:test-image'],
      clickCount: 1,
      remainingLinks: 0,
    });
  });

  it('reports download failures without leaving a link behind', async () => {
    const failure = new Error('network unavailable');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(failure));
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const wrapper = mountControls();

    await wrapper.get('[aria-label="Download image"]').trigger('click');
    await flushPromises();

    expect(consoleError).toHaveBeenCalledWith('Download failed:', failure);
  });
});
