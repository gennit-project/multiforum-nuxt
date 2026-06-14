import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useImageZoom } from '@/composables/useImageZoom';

const createMouseEvent = (overrides: Partial<MouseEvent> = {}) =>
  ({
    button: 0,
    clientX: 0,
    clientY: 0,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    target: document.createElement('div'),
    ...overrides,
  }) as unknown as MouseEvent;

const createTouch = (overrides: Partial<Touch> = {}): Touch => ({
  clientX: 0,
  clientY: 0,
  force: 0,
  identifier: 0,
  pageX: 0,
  pageY: 0,
  radiusX: 0,
  radiusY: 0,
  rotationAngle: 0,
  screenX: 0,
  screenY: 0,
  target: document.createElement('div'),
  ...overrides,
});

const createTouchList = (touches: Touch[]): TouchList => {
  const list = touches as unknown as TouchList;
  (list as unknown as { item: (index: number) => Touch | null }).item = (index: number) => touches[index] ?? null;
  (list as unknown as { length: number }).length = touches.length;
  return list;
};

const createTouchEvent = (overrides: { touches?: Partial<Touch>[]; target?: HTMLElement } = {}) => {
  const { touches = [{}], target, ...rest } = overrides;
  const touchList = createTouchList(touches.map((t) => createTouch(t)));
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    target: target ?? document.createElement('div'),
    touches: touchList,
    ...rest,
  } as unknown as TouchEvent;
};

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

  it('does not zoom out below 1', () => {
    const { zoomOut, zoomLevel } = useImageZoom();

    zoomOut();
    zoomOut();
    zoomOut();

    expect(zoomLevel.value).toBe(1);
  });

  it('resets zoom and translation', () => {
    const { zoomIn, resetZoom, zoomLevel, translateX, translateY, startDrag, onDrag } = useImageZoom();
    zoomIn();
    zoomIn();
    startDrag(createMouseEvent({ clientX: 10, clientY: 20 }));
    onDrag(createMouseEvent({ clientX: 50, clientY: 60 }));

    resetZoom();

    expect(zoomLevel.value).toBe(1);
    expect(translateX.value).toBe(0);
    expect(translateY.value).toBe(0);
  });

  it('resets translation without changing zoom', () => {
    const { zoomIn, resetTranslation, zoomLevel, translateX, translateY, startDrag, onDrag } = useImageZoom();
    zoomIn();
    startDrag(createMouseEvent({ clientX: 10, clientY: 20 }));
    onDrag(createMouseEvent({ clientX: 50, clientY: 60 }));

    resetTranslation();

    expect(zoomLevel.value).toBe(1.5);
    expect(translateX.value).toBe(0);
    expect(translateY.value).toBe(0);
  });

  it('stopDrag stops propagation when target is inside a form', () => {
    const { startDrag, stopDrag, zoomIn } = useImageZoom();
    zoomIn();
    startDrag(createMouseEvent());

    const form = document.createElement('form');
    const input = document.createElement('input');
    form.appendChild(input);
    document.body.appendChild(form);

    const event = createMouseEvent({ target: input });
    stopDrag(event);

    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('stopDrag stops propagation when target is a button', () => {
    const { startDrag, stopDrag, zoomIn } = useImageZoom();
    zoomIn();
    startDrag(createMouseEvent());

    const button = document.createElement('button');
    document.body.appendChild(button);

    const event = createMouseEvent({ target: button });
    stopDrag(event);

    expect(event.stopPropagation).toHaveBeenCalled();
  });

  describe('touch events', () => {
    it('does not start touch drag when not zoomed', () => {
      const { startTouchDrag, isDragging } = useImageZoom();

      startTouchDrag(createTouchEvent({ touches: [{ clientX: 10, clientY: 20 }] }));

      expect(isDragging.value).toBe(false);
    });

    it('starts touch drag when zoomed', () => {
      const { startTouchDrag, isDragging, zoomIn } = useImageZoom();
      zoomIn();

      const event = createTouchEvent({ touches: [{ clientX: 10, clientY: 20 }] });
      startTouchDrag(event);

      expect(isDragging.value).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('does not start touch drag when target is textarea', () => {
      const { startTouchDrag, isDragging, zoomIn } = useImageZoom();
      zoomIn();

      const textarea = document.createElement('textarea');
      startTouchDrag(createTouchEvent({ target: textarea }));

      expect(isDragging.value).toBe(false);
    });

    it('does not start touch drag when target is in text-editor-container', () => {
      const { startTouchDrag, isDragging, zoomIn } = useImageZoom();
      zoomIn();

      const container = document.createElement('div');
      container.className = 'text-editor-container';
      const child = document.createElement('span');
      container.appendChild(child);
      document.body.appendChild(container);

      startTouchDrag(createTouchEvent({ target: child }));

      expect(isDragging.value).toBe(false);
    });

    it('does not start touch drag when target is in form', () => {
      const { startTouchDrag, isDragging, zoomIn } = useImageZoom();
      zoomIn();

      const form = document.createElement('form');
      const input = document.createElement('input');
      form.appendChild(input);
      document.body.appendChild(form);

      startTouchDrag(createTouchEvent({ target: input }));

      expect(isDragging.value).toBe(false);
    });

    it('does not start touch drag when target is button', () => {
      const { startTouchDrag, isDragging, zoomIn } = useImageZoom();
      zoomIn();

      const button = document.createElement('button');
      startTouchDrag(createTouchEvent({ target: button }));

      expect(isDragging.value).toBe(false);
    });

    it('updates translation on touch drag', () => {
      const { startTouchDrag, onTouchDrag, zoomIn, translateX, translateY } = useImageZoom();
      zoomIn();

      startTouchDrag(createTouchEvent({ touches: [{ clientX: 10, clientY: 20 }] }));
      onTouchDrag(createTouchEvent({ touches: [{ clientX: 50, clientY: 70 }] }));

      expect(translateX.value).toBe(40);
      expect(translateY.value).toBe(50);
    });

    it('does not update translation when not dragging', () => {
      const { onTouchDrag, zoomIn, translateX, translateY } = useImageZoom();
      zoomIn();

      onTouchDrag(createTouchEvent({ touches: [{ clientX: 50, clientY: 70 }] }));

      expect(translateX.value).toBe(0);
      expect(translateY.value).toBe(0);
    });

    it('handles empty touches array gracefully in startTouchDrag', () => {
      const { startTouchDrag, isDragging, zoomIn } = useImageZoom();
      zoomIn();

      // Create event with empty touch list
      const emptyTouchList = createTouchList([]);
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: document.createElement('div'),
        touches: emptyTouchList,
      } as unknown as TouchEvent;

      // Should not throw when touches array is empty
      expect(() => startTouchDrag(event)).not.toThrow();
      // Should start dragging state but early return before updating coordinates
      expect(isDragging.value).toBe(true);
    });

    it('handles empty touches array gracefully in onTouchDrag', () => {
      const { startTouchDrag, onTouchDrag, zoomIn, translateX, translateY } = useImageZoom();
      zoomIn();

      startTouchDrag(createTouchEvent({ touches: [{ clientX: 10, clientY: 20 }] }));

      // Create event with empty touch list
      const emptyTouchList = createTouchList([]);
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: document.createElement('div'),
        touches: emptyTouchList,
      } as unknown as TouchEvent;

      onTouchDrag(event);

      // Should not update translation
      expect(translateX.value).toBe(0);
      expect(translateY.value).toBe(0);
    });
  });

  it('does not drag when target is inside a button', () => {
    const { startDrag, onDrag, zoomIn, translateX } = useImageZoom();
    zoomIn();

    startDrag(createMouseEvent({ clientX: 10, clientY: 10 }));
    const button = document.createElement('button');
    onDrag(createMouseEvent({ clientX: 30, clientY: 40, target: button }));

    expect(translateX.value).toBe(0);
  });
});
