import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ref, defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { usePopoverPositioning } from '@/composables/usePopoverPositioning';

type Rect = { width: number; height: number };

const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
  });
};

const createPopoverRef = (rect: Rect) =>
  ref({
    getBoundingClientRect: () => rect,
  } as unknown as HTMLElement);

const mountPopoverComposable = (options: {
  position: { top: number; left: number; placement?: 'above' | 'below'; triggerRect?: any };
  rect: Rect;
  isVisible?: boolean;
}) => {
  const popoverRef = createPopoverRef(options.rect);
  const position = ref(options.position);
  const isVisible = ref(options.isVisible ?? true);
  let api!: ReturnType<typeof usePopoverPositioning>;

  const wrapper = mount(defineComponent({
    setup() {
      api = usePopoverPositioning({ popoverRef, position, isVisible });
      return () => h('div');
    },
  }));

  return { wrapper, api };
};

describe('usePopoverPositioning', () => {
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;

  beforeEach(() => {
    setViewport(300, 200);
  });

  afterEach(() => {
    setViewport(originalWidth, originalHeight);
  });

  it.each([
    {
      name: 'clamps right edge within viewport',
      position: { top: 20, left: 250 },
      rect: { width: 200, height: 50 },
      expected: { top: 20, left: 88 },
    },
    {
      name: 'clamps left edge within viewport',
      position: { top: 20, left: -10 },
      rect: { width: 100, height: 50 },
      expected: { top: 20, left: 12 },
    },
    {
      name: 'clamps bottom edge within viewport',
      position: { top: 190, left: 20 },
      rect: { width: 100, height: 50 },
      expected: { top: 138, left: 20 },
    },
  ])('$name', async ({ position, rect, expected }) => {
    const { wrapper, api } = mountPopoverComposable({ position, rect });
    await api.updateAdjustedPosition();
    const adjustedPosition = api.adjustedPosition;
    wrapper.unmount();

    expect(adjustedPosition.value).toEqual(expected);
  });

  it('prefers above but falls below when above would overflow', async () => {
    const position = {
      top: 0,
      left: 20,
      placement: 'above' as const,
      triggerRect: { top: 10, bottom: 30, height: 20, width: 40 },
    };
    const { wrapper, api } = mountPopoverComposable({
      position,
      rect: { width: 120, height: 50 },
    });
    await api.updateAdjustedPosition();
    const adjustedPosition = api.adjustedPosition;
    wrapper.unmount();

    expect(adjustedPosition.value).toEqual({ top: 38, left: 20 });
  });

  it('prefers below but falls above when below would overflow', async () => {
    const position = {
      top: 0,
      left: 20,
      placement: 'below' as const,
      triggerRect: { top: 170, bottom: 190, height: 20, width: 40 },
    };
    const { wrapper, api } = mountPopoverComposable({
      position,
      rect: { width: 120, height: 40 },
    });
    await api.updateAdjustedPosition();
    const adjustedPosition = api.adjustedPosition;
    wrapper.unmount();

    expect(adjustedPosition.value).toEqual({ top: 122, left: 20 });
  });
});
