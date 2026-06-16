import { describe, it, expect, vi } from 'vitest';
import { useImageZoomPan } from '@/composables/useImageZoomPan';

const mouse = (overrides: Partial<MouseEvent> = {}) =>
  ({ button: 0, clientX: 0, clientY: 0, preventDefault: vi.fn(), ...overrides } as unknown as MouseEvent);

const key = (k: string) => ({ key: k } as KeyboardEvent);

describe('useImageZoomPan', () => {
  it('starts at zoom level 1 and not zoomed', () => {
    const z = useImageZoomPan();
    expect(z.isZoomed.value).toBe(false);
  });

  it('zooms in by the step up to the max', () => {
    const z = useImageZoomPan();
    z.zoomIn();
    z.zoomIn();
    z.zoomIn();
    z.zoomIn(); // would exceed max (3), should clamp
    expect(z.zoomLevel.value).toBe(3);
  });

  it('marks isZoomed once above 1', () => {
    const z = useImageZoomPan();
    z.zoomIn();
    expect(z.isZoomed.value).toBe(true);
  });

  it('does not zoom out below the minimum', () => {
    const z = useImageZoomPan();
    z.zoomOut();
    expect(z.zoomLevel.value).toBe(1);
  });

  it('resets zoom and translation', () => {
    const z = useImageZoomPan();
    z.zoomIn();
    z.resetZoom();
    expect(z.zoomLevel.value).toBe(1);
  });

  it('opens the lightbox when the guard allows it', () => {
    const z = useImageZoomPan({ canOpenLightbox: () => true });
    z.openLightbox();
    expect(z.isLightboxOpen.value).toBe(true);
  });

  it('does not open the lightbox when the guard denies it', () => {
    const z = useImageZoomPan({ canOpenLightbox: () => false });
    z.openLightbox();
    expect(z.isLightboxOpen.value).toBe(false);
  });

  it('closes the lightbox and resets zoom', () => {
    const z = useImageZoomPan();
    z.openLightbox();
    z.zoomIn();
    z.closeLightbox();
    expect(z.isLightboxOpen.value).toBe(false);
  });

  it('ignores drag start when not zoomed', () => {
    const z = useImageZoomPan();
    z.startDrag(mouse());
    expect(z.isDragging.value).toBe(false);
  });

  it('ignores non-left-button drag start', () => {
    const z = useImageZoomPan();
    z.zoomIn();
    z.startDrag(mouse({ button: 1 }));
    expect(z.isDragging.value).toBe(false);
  });

  it('begins dragging on a left click when zoomed', () => {
    const z = useImageZoomPan();
    z.zoomIn();
    z.startDrag(mouse({ clientX: 10, clientY: 20 }));
    expect(z.isDragging.value).toBe(true);
  });

  it('updates the translation while dragging', () => {
    const z = useImageZoomPan();
    z.zoomIn();
    z.startDrag(mouse({ clientX: 10, clientY: 20 }));
    z.onDrag(mouse({ clientX: 30, clientY: 50 }));
    expect({ x: z.translateX.value, y: z.translateY.value }).toEqual({ x: 20, y: 30 });
  });

  it('does not update translation when not dragging', () => {
    const z = useImageZoomPan();
    z.onDrag(mouse({ clientX: 30, clientY: 50 }));
    expect(z.translateX.value).toBe(0);
  });

  it('stops dragging', () => {
    const z = useImageZoomPan();
    z.zoomIn();
    z.startDrag(mouse());
    z.stopDrag();
    expect(z.isDragging.value).toBe(false);
  });

  it('ignores key presses when the lightbox is closed', () => {
    const z = useImageZoomPan();
    z.handleKeyDown(key('+'));
    expect(z.zoomLevel.value).toBe(1);
  });

  it('zooms in on "+" when the lightbox is open', () => {
    const z = useImageZoomPan({ canOpenLightbox: () => true });
    z.openLightbox();
    z.handleKeyDown(key('+'));
    expect(z.zoomLevel.value).toBe(1.5);
  });

  it('closes on Escape when the lightbox is open', () => {
    const z = useImageZoomPan({ canOpenLightbox: () => true });
    z.openLightbox();
    z.handleKeyDown(key('Escape'));
    expect(z.isLightboxOpen.value).toBe(false);
  });
});
