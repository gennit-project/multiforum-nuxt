import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import StlViewer from '@/components/download/StlViewer.vue';

// Control the STL loader's outcome per test.
const stl = vi.hoisted(() => ({
  mode: 'success' as 'success' | 'error',
  controls: null as null | Record<string, unknown>,
  renderer: null as null | Record<string, unknown>,
  scene: null as null | { children: unknown[]; add: ReturnType<typeof vi.fn> },
  controlEvents: {} as Record<string, () => void>,
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
      addEventListener: vi.fn((name: string, callback: () => void) => {
        stl.controlEvents[name] = callback;
      }),
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
      return {
        position: { set: vi.fn() },
        lookAt: vi.fn(),
        aspect: 1,
        fov: 45,
        updateProjectionMatrix: vi.fn(),
      };
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
  stl.scene = null;
  stl.controlEvents = {};
  vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

describe('StlViewer', () => {
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
    }).toEqual({ renderer: 1, controls: 1, animation: 1 });
  });
});
