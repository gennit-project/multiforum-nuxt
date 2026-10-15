import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import StlViewer from '@/components/download/StlViewer.vue';

// Control the STL loader's outcome per test.
const stl = vi.hoisted(() => ({
  mode: 'success' as 'success' | 'error',
  controls: null as null | Record<string, unknown>,
  renderer: null as null | Record<string, unknown>,
  camera: null as null | Record<string, unknown>,
  scene: null as null | { children: unknown[]; add: ReturnType<typeof vi.fn> },
  controlEvents: {} as Record<string, () => void>,
  keyEventTarget: null as null | HTMLElement,
}));

vi.mock('three/examples/jsm/loaders/STLLoader', () => ({
  STLLoader: vi.fn(function () {
    return {
      load: vi.fn(
        (
          _url: string,
          onLoad: (g: unknown) => void,
          onProgress?: (p: { loaded: number; total: number }) => void,
          onError?: (e: Error) => void
        ) => {
          if (stl.mode === 'error') {
            onError?.(new Error('bad stl'));
            return;
          }
          onProgress?.({ loaded: 50, total: 100 });
          onLoad({
            computeBoundingBox: vi.fn(),
            boundingBox: { getCenter: vi.fn() },
          });
        }
      ),
    };
  }),
}));

vi.mock('three/examples/jsm/controls/OrbitControls', () => ({
  OrbitControls: vi.fn(function () {
    stl.controls = {
      enableDamping: true,
      dampingFactor: 0,
      autoRotate: false,
      autoRotateSpeed: 0,
      minDistance: 0,
      maxDistance: Infinity,
      target: {},
      addEventListener: vi.fn((name: string, callback: () => void) => {
        stl.controlEvents[name] = callback;
      }),
      listenToKeyEvents: vi.fn((target: HTMLElement) => {
        stl.keyEventTarget = target;
      }),
      stopListenToKeyEvents: vi.fn(),
      update: vi.fn(),
      dispose: vi.fn(),
    };
    return stl.controls;
  }),
}));

vi.mock('three', () => {
  const v3 = () => ({ x: 1, y: 1, z: 1, set: vi.fn(), sub: vi.fn() });
  return {
    Scene: vi.fn(function () {
      const children: unknown[] = [];
      stl.scene = {
        children,
        add: vi.fn((child: unknown) => children.push(child)),
      };
      return { ...stl.scene, background: null };
    }),
    Color: vi.fn(function () {
      return {};
    }),
    PerspectiveCamera: vi.fn(function () {
      const position = {
        set: vi.fn(),
        distanceTo: vi.fn(() => 10),
        sub: vi.fn().mockReturnThis(),
        setLength: vi.fn().mockReturnThis(),
        add: vi.fn().mockReturnThis(),
      };
      stl.camera = {
        position,
        lookAt: vi.fn(),
        aspect: 1,
        fov: 45,
        updateProjectionMatrix: vi.fn(),
      };
      return stl.camera;
    }),
    WebGLRenderer: vi.fn(function () {
      stl.renderer = {
        setSize: vi.fn(),
        render: vi.fn(),
        dispose: vi.fn(),
        domElement: document.createElement('canvas'),
      };
      return stl.renderer;
    }),
    AmbientLight: vi.fn(function () {
      return {};
    }),
    DirectionalLight: vi.fn(function () {
      return { position: { set: vi.fn() } };
    }),
    GridHelper: vi.fn(function () {
      return {};
    }),
    MeshStandardMaterial: vi.fn(function () {
      return {};
    }),
    Mesh: vi.fn(function () {
      return { position: { sub: vi.fn() }, isMesh: true };
    }),
    Vector3: vi.fn(function () {
      return v3();
    }),
    Box3: vi.fn(function () {
      const b: Record<string, unknown> = {
        getSize: vi.fn(() => ({ x: 1, y: 1, z: 1 })),
      };
      b.setFromObject = vi.fn(() => b);
      return b;
    }),
  };
});

const mountViewer = (props: Record<string, unknown> = {}) =>
  mount(StlViewer, { props });

beforeEach(() => {
  vi.clearAllMocks();
  stl.mode = 'success';
  stl.controls = null;
  stl.renderer = null;
  stl.camera = null;
  stl.scene = null;
  stl.controlEvents = {};
  stl.keyEventTarget = null;
  vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

describe('StlViewer', () => {
  it('exposes a named keyboard-operable application region', async () => {
    const wrapper = mountViewer({
      src: 'http://x/model.stl',
      label: 'Gear assembly preview',
    });
    await flushPromises();

    expect({
      role: wrapper.attributes('role'),
      label: wrapper.attributes('aria-label'),
      tabindex: wrapper.attributes('tabindex'),
      canvasHidden: wrapper.get('canvas').attributes('aria-hidden'),
      instructions: wrapper.get('.interaction-hint').text(),
    }).toEqual({
      role: 'application',
      label: 'Gear assembly preview',
      tabindex: '0',
      canvasHidden: 'true',
      instructions:
        'Keyboard: Arrow keys pan, Shift plus arrow keys rotate, plus and minus zoom, and 0 resets the view.',
    });
  });

  it('connects OrbitControls keyboard handling to the focusable viewer', async () => {
    const wrapper = mountViewer({ src: 'http://x/model.stl' });
    await flushPromises();

    expect(stl.keyEventTarget).toBe(wrapper.element);
  });

  it.each([
    ['+', 9],
    ['-', 11],
  ])('uses the %s key to zoom the camera', async (key, distance) => {
    const wrapper = mountViewer({ src: 'http://x/model.stl' });
    await flushPromises();

    await wrapper.trigger('keydown', { key });

    const setLength = stl.camera?.position.setLength as ReturnType<
      typeof vi.fn
    >;
    expect(setLength).toHaveBeenCalledWith(distance);
  });

  it('uses the 0 key to reset the camera', async () => {
    const wrapper = mountViewer({ src: 'http://x/model.stl' });
    await flushPromises();
    const setPosition = stl.camera?.position.set as ReturnType<typeof vi.fn>;
    setPosition.mockClear();

    await wrapper.trigger('keydown', { key: '0' });

    expect(setPosition).toHaveBeenCalledOnce();
  });

  it('announces when the model has loaded', async () => {
    const wrapper = mountViewer({ src: 'http://x/model.stl' });
    await flushPromises();

    expect(wrapper.get('[role="status"]').text()).toBe('3D model loaded.');
  });

  it('announces loading errors as alerts', async () => {
    stl.mode = 'error';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mountViewer({ src: 'http://x/bad.stl' });
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toBe(
      'Failed to load 3D model'
    );
  });

  it('stays in the loading state when no src is provided', () => {
    const wrapper = mountViewer();
    expect(wrapper.html()).toBeTruthy();
  });

  it('loads the model and emits load + progress', async () => {
    const wrapper = mountViewer({ src: 'http://x/model.stl', showGrid: true });
    await flushPromises();
    expect(wrapper.emitted('progress')).toBeTruthy();
    expect(wrapper.emitted('load')).toBeTruthy();
  });

  it('emits an error when the loader fails', async () => {
    stl.mode = 'error';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mountViewer({ src: 'http://x/bad.stl' });
    await flushPromises();
    expect(wrapper.emitted('error')).toBeTruthy();
  });

  it('tracks hover state', async () => {
    const wrapper = mountViewer({ src: 'http://x/model.stl' });
    await flushPromises();
    await wrapper.trigger('mouseenter');
    await wrapper.trigger('mouseleave');
    expect(wrapper.html()).toBeTruthy();
  });

  it('updates interaction cursor while orbit controls are active', async () => {
    mountViewer({ src: 'http://x/model.stl' });
    await flushPromises();
    stl.controlEvents.start?.();
    const grabbing = (stl.renderer?.domElement as HTMLCanvasElement).style
      .cursor;
    stl.controlEvents.end?.();
    expect({
      grabbing,
      idle: (stl.renderer?.domElement as HTMLCanvasElement).style.cursor,
    }).toEqual({ grabbing: 'grabbing', idle: 'grab' });
  });

  it('resizes the renderer and camera when the window changes size', async () => {
    mountViewer({ src: 'http://x/model.stl' });
    await flushPromises();
    (stl.renderer?.setSize as ReturnType<typeof vi.fn>).mockClear();
    window.dispatchEvent(new Event('resize'));
    expect(stl.renderer?.setSize).toHaveBeenCalledOnce();
  });

  it('resets the camera and toggles auto rotation through exposed methods', async () => {
    const wrapper = mountViewer({ src: 'http://x/model.stl' });
    await flushPromises();
    wrapper.vm.resetCamera();
    wrapper.vm.setAutoRotate(true);
    expect({
      autoRotate: stl.controls?.autoRotate,
      updates: (stl.controls?.update as ReturnType<typeof vi.fn>).mock.calls
        .length,
    }).toEqual({ autoRotate: true, updates: 3 });
  });

  it('cleans up the previous renderer and loads a changed source', async () => {
    const wrapper = mountViewer({ src: 'http://x/first.stl' });
    await flushPromises();
    const firstRenderer = stl.renderer;
    const firstControls = stl.controls;
    await wrapper.setProps({ src: 'http://x/second.stl' });
    await flushPromises();
    expect({
      rendererDisposed: (firstRenderer?.dispose as ReturnType<typeof vi.fn>)
        .mock.calls.length,
      controlsDisposed: (firstControls?.dispose as ReturnType<typeof vi.fn>)
        .mock.calls.length,
      canvases: wrapper.findAll('canvas').length,
    }).toEqual({
      rendererDisposed: 1,
      controlsDisposed: 1,
      canvases: 1,
    });
  });

  it('disposes viewer resources when unmounted', async () => {
    const wrapper = mountViewer({ src: 'http://x/model.stl' });
    await flushPromises();
    const renderer = stl.renderer;
    const controls = stl.controls;
    wrapper.unmount();
    expect({
      renderer: (renderer?.dispose as ReturnType<typeof vi.fn>).mock.calls
        .length,
      controls: (controls?.dispose as ReturnType<typeof vi.fn>).mock.calls
        .length,
      animation: vi.mocked(cancelAnimationFrame).mock.calls.length,
      keyboard: (controls?.stopListenToKeyEvents as ReturnType<typeof vi.fn>)
        .mock.calls.length,
    }).toEqual({ renderer: 1, controls: 1, animation: 1, keyboard: 1 });
  });
});
