import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import StlViewer from '@/components/download/StlViewer.vue';

// Control the STL loader's outcome per test.
const stl = vi.hoisted(() => ({ mode: 'success' as 'success' | 'error' }));

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
          onLoad({ computeBoundingBox: vi.fn(), boundingBox: { getCenter: vi.fn() } });
        }
      ),
    };
  }),
}));

vi.mock('three/examples/jsm/controls/OrbitControls', () => ({
  OrbitControls: vi.fn(function () {
    return {
      enableDamping: true,
      dampingFactor: 0,
      autoRotate: false,
      autoRotateSpeed: 0,
      addEventListener: vi.fn(),
      update: vi.fn(),
      dispose: vi.fn(),
    };
  }),
}));

vi.mock('three', () => {
  const v3 = () => ({ x: 1, y: 1, z: 1, set: vi.fn(), sub: vi.fn() });
  return {
    Scene: vi.fn(function () {
      return { add: vi.fn(), background: null, children: [] };
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
      return {
        setSize: vi.fn(),
        render: vi.fn(),
        dispose: vi.fn(),
        domElement: document.createElement('canvas'),
      };
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
});
