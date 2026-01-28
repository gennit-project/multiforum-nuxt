import { describe, it, expect, beforeEach } from 'vitest';
import { useImageZoom } from '@/composables/useImageZoom';

const createMouseEvent = (overrides: Partial<MouseEvent> = {}) =>
  ({
    button: 0,
    clientX: 0,
    clientY: 0,
    preventDefault: () => {},
    target: document.createElement('div'),
    ...overrides,
  } as MouseEvent);

describe('useImageZoom', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('does not start drag when not zoomed', () => {
    const { startDrag, isDragging } = useImageZoom();

    startDrag(createMouseEvent({ clientX: 10, clientY: 20 }));

    expect(isDragging.value).toBe(false);
  });

  it('does not start drag on non-left click', () => {
    const { startDrag, isDragging, zoomIn } = useImageZoom();
    zoomIn();

    startDrag(createMouseEvent({ button: 2 }));

    expect(isDragging.value).toBe(false);
  });

  it('does not drag when event target is a textarea', () => {
    const { startDrag, onDrag, zoomIn, translateX } = useImageZoom();
    zoomIn();

    startDrag(createMouseEvent({ clientX: 10, clientY: 10 }));
    const textarea = document.createElement('textarea');
    onDrag(createMouseEvent({ clientX: 30, clientY: 40, target: textarea }));

    expect(translateX.value).toBe(0);
  });

  it('does not drag when event target is within a text editor container', () => {
    const { startDrag, onDrag, zoomIn, translateY } = useImageZoom();
    zoomIn();

    startDrag(createMouseEvent({ clientX: 10, clientY: 10 }));
    const container = document.createElement('div');
    container.className = 'text-editor-container';
    const child = document.createElement('span');
    container.appendChild(child);
    onDrag(createMouseEvent({ clientX: 50, clientY: 60, target: child }));

    expect(translateY.value).toBe(0);
  });

  it('updates translation when dragging with zoom enabled', () => {
    const { startDrag, onDrag, zoomIn, translateX, translateY } = useImageZoom();
    zoomIn();

    startDrag(createMouseEvent({ clientX: 10, clientY: 20 }));
    onDrag(createMouseEvent({ clientX: 30, clientY: 50 }));

    expect({ x: translateX.value, y: translateY.value }).toEqual({ x: 20, y: 30 });
  });

  it('stops dragging when stopDrag is called', () => {
    const { startDrag, stopDrag, isDragging, zoomIn } = useImageZoom();
    zoomIn();

    startDrag(createMouseEvent());
    stopDrag();

    expect(isDragging.value).toBe(false);
  });

  it('keeps zoom level between 1 and 3', () => {
    const { zoomIn, zoomOut, zoomLevel } = useImageZoom();

    zoomOut();
    zoomIn();
    zoomIn();
    zoomIn();
    zoomIn();
    zoomIn();

    expect(zoomLevel.value).toBe(3);
  });
});
