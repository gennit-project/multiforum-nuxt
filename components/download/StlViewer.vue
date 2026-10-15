<template>
  <div
    ref="container"
    class="stl-container"
    :class="{ 'is-interactive': !loading && !error }"
    :style="containerStyle"
    role="application"
    :aria-label="label"
    :aria-describedby="instructionsId"
    :aria-disabled="loading || error ? 'true' : undefined"
    tabindex="0"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @keydown="handleKeydown"
  >
    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {{ loadStatus }}
    </p>
    <p :id="instructionsId" class="interaction-hint">
      Keyboard: Arrow keys pan, Shift plus arrow keys rotate, plus and minus
      zoom, and 0 resets the view.
    </p>
    <div v-if="loading" class="loading-overlay" aria-hidden="true">
      Loading 3D model...
    </div>
    <div v-if="error" class="error-overlay" role="alert">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  onMounted,
  ref,
  watch,
  onBeforeUnmount,
  computed,
  nextTick,
  useId,
} from 'vue';
// Named imports (not `import * as THREE`) so the bundler can tree-shake the
// parts of three.js this viewer never uses.
import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  GridHelper,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  // @ts-expect-error - THREE.js types not installed
} from 'three';
// @ts-expect-error - THREE.js types not installed
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
// @ts-expect-error - THREE.js types not installed
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import type { CSSProperties } from 'vue';
import {
  buildContainerStyle,
  calculateCameraDistance,
  computeLoadProgressPercent,
} from '@/utils/stlViewer';

interface Props {
  src: string;
  width?: number | string;
  height?: number | string;
  maxWidth?: number | string | null;
  aspectRatio?: number;
  modelColor?: string;
  backgroundColor?: string;
  autoRotate?: boolean;
  showGrid?: boolean;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: 400,
  maxWidth: null,
  aspectRatio: 1,
  modelColor: '#607d8b',
  backgroundColor: '#f0f0f0',
  autoRotate: false,
  showGrid: false,
  label: 'Interactive 3D model',
});

const instructionsId = `stl-viewer-instructions-${useId()}`;

const containerStyle = computed((): CSSProperties =>
  buildContainerStyle(props.width, props.height, props.maxWidth)
);

const emit = defineEmits<{
  load: [data: { geometry: unknown; mesh: unknown }];
  progress: [percent: number];
  error: [error: unknown];
}>();

const container = ref<HTMLDivElement | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const isHovered = ref(false);
const actualWidth = ref(400);
const actualHeight = ref(400);
const loadStatus = computed(() => {
  if (loading.value) return 'Loading 3D model.';
  if (error.value) return '';
  return '3D model loaded.';
});

// THREE.js objects lack type declarations here, so these are intentionally `any`.
/* eslint-disable @typescript-eslint/no-explicit-any */
let scene: any, camera: any, renderer: any, controls: any;
/* eslint-enable @typescript-eslint/no-explicit-any */
let animationId: number | undefined;

function updateDimensions() {
  if (!container.value) return;

  const rect = container.value.getBoundingClientRect();
  actualWidth.value = rect.width;
  actualHeight.value = rect.height;

  if (renderer && camera) {
    renderer.setSize(actualWidth.value, actualHeight.value);
    camera.aspect = actualWidth.value / actualHeight.value;
    camera.updateProjectionMatrix();
  }
}

function handleResize() {
  updateDimensions();
}

function initViewer(stlUrl: string) {
  if (!container.value) return;

  loading.value = true;
  error.value = null;

  // Wait for next tick to ensure container has proper dimensions
  nextTick(() => {
    updateDimensions();

    scene = new Scene();
    scene.background = new Color(props.backgroundColor);

    camera = new PerspectiveCamera(
      45,
      actualWidth.value / actualHeight.value,
      0.1,
      1000
    );
    camera.position.set(3, 3, 3);

    renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(actualWidth.value, actualHeight.value);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.value!.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = props.autoRotate;
    controls.autoRotateSpeed = 2;
    controls.listenToKeyEvents(container.value!);

    // Add visual feedback for interaction
    renderer.domElement.style.cursor = 'grab';

    controls.addEventListener('start', () => {
      renderer.domElement.style.cursor = 'grabbing';
    });

    controls.addEventListener('end', () => {
      renderer.domElement.style.cursor = 'grab';
    });

    const ambientLight = new AmbientLight(0x999999);
    scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Grid (optional)
    if (props.showGrid) {
      const gridHelper = new GridHelper(200, 20);
      scene.add(gridHelper);
    }

    const loader = new STLLoader();
    loader.load(
      stlUrl,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (geometry: any) => {
        const material = new MeshStandardMaterial({
          color: props.modelColor,
        });
        const mesh = new Mesh(geometry, material);

        geometry.computeBoundingBox();
        const center = new Vector3();
        geometry.boundingBox.getCenter(center);
        mesh.position.sub(center); // center the object

        scene.add(mesh);

        // Adjust camera position based on object size
        const box = new Box3().setFromObject(mesh);
        const size = box.getSize(new Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = calculateCameraDistance(maxDim, camera.fov);

        camera.position.set(distance, distance, distance);
        camera.lookAt(0, 0, 0);
        controls.update();

        loading.value = false;
        emit('load', { geometry, mesh });
      },
      (progress: { loaded: number; total: number }) => {
        const percent = computeLoadProgressPercent(
          progress.loaded,
          progress.total
        );
        emit('progress', percent);
      },
      (loadError: Error) => {
        console.error('Error loading STL:', loadError);
        error.value = 'Failed to load 3D model';
        loading.value = false;
        emit('error', loadError);
      }
    );

    animate();
  });
}

function animate() {
  animationId = requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function onMouseEnter() {
  isHovered.value = true;
}

function onMouseLeave() {
  isHovered.value = false;
}

function resetCamera() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (camera && controls && scene.children.find((child: any) => child.isMesh)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mesh = scene.children.find((child: any) => child.isMesh);
    const box = new Box3().setFromObject(mesh);
    const size = box.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = calculateCameraDistance(maxDim, camera.fov);

    camera.position.set(distance, distance, distance);
    camera.lookAt(0, 0, 0);
    controls.update();
  }
}

function zoomCamera(scale: number) {
  if (!camera || !controls) return;

  const currentDistance = camera.position.distanceTo(controls.target);
  const nextDistance = Math.min(
    controls.maxDistance,
    Math.max(controls.minDistance, currentDistance * scale)
  );

  camera.position
    .sub(controls.target)
    .setLength(nextDistance)
    .add(controls.target);
  controls.update();
}

function handleKeydown(event: KeyboardEvent) {
  if (loading.value || error.value || !controls) return;

  if (event.key === '+' || event.key === '=') {
    event.preventDefault();
    zoomCamera(0.9);
  } else if (event.key === '-' || event.key === '_') {
    event.preventDefault();
    zoomCamera(1.1);
  } else if (event.key === '0') {
    event.preventDefault();
    resetCamera();
  }
}

function cleanup() {
  const containerElement = container.value;
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (renderer) {
    renderer.dispose();
  }
  if (controls) {
    controls.stopListenToKeyEvents();
    controls.dispose();
  }
  if (
    renderer?.domElement &&
    renderer.domElement.parentNode === containerElement &&
    containerElement
  ) {
    containerElement.removeChild(renderer.domElement);
  }
}

onMounted(() => {
  if (props.src) {
    initViewer(props.src);
  }
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  cleanup();
  window.removeEventListener('resize', handleResize);
});

watch(
  () => props.src,
  (newUrl, oldUrl) => {
    if (newUrl !== oldUrl) {
      cleanup();
      if (newUrl) {
        initViewer(newUrl);
      }
    }
  }
);

// Exposed methods for parent components
defineExpose({
  resetCamera,
  setAutoRotate: (value: boolean) => {
    if (controls) {
      controls.autoRotate = value;
    }
  },
});
</script>

<style scoped>
.stl-container {
  overflow: hidden;
  position: relative;
  display: block;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  transition: all 0.2s ease;
  border-radius: 8px;
}

.stl-container:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.interaction-hint {
  position: absolute;
  right: 8px;
  bottom: 8px;
  left: 8px;
  z-index: 10;
  margin: 0;
  border-radius: 6px;
  background: rgba(17, 24, 39, 0.92);
  color: white;
  padding: 8px 12px;
  font-size: 0.75rem;
  line-height: 1rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.stl-container:focus .interaction-hint {
  opacity: 1;
}

.stl-container.is-interactive {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stl-container.is-interactive:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

canvas {
  display: block;
  width: 100% !important;
  height: auto !important;
  max-width: 100%;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.error-overlay {
  background: rgba(255, 0, 0, 0.1);
  color: #d32f2f;
}
</style>
