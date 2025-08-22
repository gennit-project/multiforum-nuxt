<template>
  <div
    ref="container"
    class="stl-container"
    :class="{ 'is-interactive': !loading && !error }"
    :style="containerStyle"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div v-if="loading" class="loading-overlay">Loading 3D model...</div>
    <div v-if="error" class="error-overlay">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import {
  onMounted,
  ref,
  watch,
  onBeforeUnmount,
  computed,
  nextTick,
} from 'vue';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  width: {
    type: [Number, String],
    default: '100%',
  },
  height: {
    type: [Number, String],
    default: 400,
  },
  maxWidth: {
    type: [Number, String],
    default: null,
  },
  aspectRatio: {
    type: Number,
    default: 1, // 1:1 square by default
  },
  modelColor: {
    type: String,
    default: '#607d8b',
  },
  backgroundColor: {
    type: String,
    default: '#f0f0f0',
  },
  autoRotate: {
    type: Boolean,
    default: false,
  },
  showGrid: {
    type: Boolean,
    default: false,
  },
});

const containerStyle = computed(() => {
  const style = {};

  // Handle width
  if (typeof props.width === 'number') {
    style.width = props.width + 'px';
  } else {
    style.width = props.width;
  }

  // Handle height
  if (typeof props.height === 'number') {
    style.height = props.height + 'px';
  } else {
    style.height = props.height;
  }

  // Handle max-width for responsive behavior
  if (props.maxWidth) {
    if (typeof props.maxWidth === 'number') {
      style.maxWidth = props.maxWidth + 'px';
    } else {
      style.maxWidth = props.maxWidth;
    }
  }

  return style;
});

const emit = defineEmits(['load', 'progress', 'error']);

const container = ref(null);
const loading = ref(true);
const error = ref(null);
const isHovered = ref(false);
const actualWidth = ref(400);
const actualHeight = ref(400);

let scene, camera, renderer, controls, animationId;

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

function initViewer(stlUrl) {
  if (!container.value) return;

  loading.value = true;
  error.value = null;

  // Wait for next tick to ensure container has proper dimensions
  nextTick(() => {
    updateDimensions();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(props.backgroundColor);

    camera = new THREE.PerspectiveCamera(
      45,
      actualWidth.value / actualHeight.value,
      0.1,
      1000
    );
    camera.position.set(3, 3, 3);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(actualWidth.value, actualHeight.value);
    container.value.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = props.autoRotate;
    controls.autoRotateSpeed = 2;

    // Add visual feedback for interaction
    renderer.domElement.style.cursor = 'grab';

    controls.addEventListener('start', () => {
      renderer.domElement.style.cursor = 'grabbing';
    });

    controls.addEventListener('end', () => {
      renderer.domElement.style.cursor = 'grab';
    });

    const ambientLight = new THREE.AmbientLight(0x999999);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Grid (optional)
    if (props.showGrid) {
      const gridHelper = new THREE.GridHelper(200, 20);
      scene.add(gridHelper);
    }

    const loader = new STLLoader();
    loader.load(
      stlUrl,
      (geometry) => {
        const material = new THREE.MeshStandardMaterial({
          color: props.modelColor,
        });
        const mesh = new THREE.Mesh(geometry, material);

        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        mesh.position.sub(center); // center the object

        scene.add(mesh);

        // Adjust camera position based on object size
        const box = new THREE.Box3().setFromObject(mesh);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const distance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.5;

        camera.position.set(distance, distance, distance);
        camera.lookAt(0, 0, 0);
        controls.update();

        loading.value = false;
        emit('load', { geometry, mesh });
      },
      (progress) => {
        const percent =
          progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0;
        emit('progress', percent);
      },
      (loadError) => {
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
  if (camera && controls && scene.children.find((child) => child.isMesh)) {
    const mesh = scene.children.find((child) => child.isMesh);
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const distance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.5;

    camera.position.set(distance, distance, distance);
    camera.lookAt(0, 0, 0);
    controls.update();
  }
}

function cleanup() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (renderer) {
    renderer.dispose();
  }
  if (controls) {
    controls.dispose();
  }
  while (container.value?.firstChild) {
    container.value.removeChild(container.value.firstChild);
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
  setAutoRotate: (value) => {
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
