<template>
  <div class="stl-viewer-container" ref="container">
    <div v-if="loading" class="loading-overlay">
      Loading 3D model...
    </div>
    <div v-if="error" class="error-overlay">
      {{ error }}
    </div>
  </div>
</template>

<script>
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default {
  name: 'StlViewer',
  props: {
    src: {
      type: String,
      required: true
    },
    width: {
      type: Number,
      default: 400
    },
    height: {
      type: Number,
      default: 400
    },
    modelColor: {
      type: String,
      default: '#0066ff'
    },
    backgroundColor: {
      type: String,
      default: '#f0f0f0'
    },
    autoRotate: {
      type: Boolean,
      default: false
    },
    showGrid: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      loading: true,
      error: null,
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      mesh: null
    };
  },
  mounted() {
    this.initViewer();
    this.loadModel();
  },
  beforeDestroy() {
    this.cleanup();
  },
  watch: {
    src(newSrc) {
      this.loadModel();
    }
  },
  methods: {
    initViewer() {
      const container = this.$refs.container;
      
      // Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(this.backgroundColor);
      
      // Camera
      this.camera = new THREE.PerspectiveCamera(
        50,
        this.width / this.height,
        0.1,
        1000
      );
      
      // Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(this.width, this.height);
      this.renderer.shadowMap.enabled = true;
      container.appendChild(this.renderer.domElement);
      
      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
      directionalLight.position.set(10, 10, 10);
      directionalLight.castShadow = true;
      this.scene.add(directionalLight);
      
      // Controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.autoRotate = this.autoRotate;
      this.controls.autoRotateSpeed = 2;
      
      // Grid
      if (this.showGrid) {
        const gridHelper = new THREE.GridHelper(200, 20);
        this.scene.add(gridHelper);
      }
      
      // Start animation
      this.animate();
    },
    
    loadModel() {
      this.loading = true;
      this.error = null;
      
      // Remove existing mesh
      if (this.mesh) {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
      }
      
      const loader = new STLLoader();
      
      loader.load(
        this.src,
        (geometry) => {
          // Center geometry
          geometry.computeBoundingBox();
          const center = geometry.boundingBox.getCenter(new THREE.Vector3());
          geometry.translate(-center.x, -center.y, -center.z);
          
          // Create mesh
          const material = new THREE.MeshPhongMaterial({
            color: this.modelColor,
            specular: 0x111111,
            shininess: 200
          });
          
          this.mesh = new THREE.Mesh(geometry, material);
          this.mesh.castShadow = true;
          this.mesh.receiveShadow = true;
          this.scene.add(this.mesh);
          
          // Adjust camera
          const box = new THREE.Box3().setFromObject(this.mesh);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = this.camera.fov * (Math.PI / 180);
          const distance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.5;
          
          this.camera.position.set(distance, distance, distance);
          this.camera.lookAt(0, 0, 0);
          this.controls.update();
          
          this.loading = false;
          this.$emit('load', { geometry, mesh: this.mesh });
        },
        (progress) => {
          const percent = (progress.loaded / progress.total) * 100;
          this.$emit('progress', percent);
        },
        (error) => {
          console.error('Error loading STL:', error);
          this.error = 'Failed to load 3D model';
          this.loading = false;
          this.$emit('error', error);
        }
      );
    },
    
    animate() {
      if (!this.renderer) return;
      
      requestAnimationFrame(() => this.animate());
      
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    },
    
    cleanup() {
      if (this.renderer) {
        this.renderer.dispose();
        this.$refs.container.removeChild(this.renderer.domElement);
      }
      
      if (this.mesh) {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
      }
      
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.controls = null;
      this.mesh = null;
    },
    
    // Public methods
    resetCamera() {
      if (this.camera && this.controls && this.mesh) {
        const box = new THREE.Box3().setFromObject(this.mesh);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        const distance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.5;
        
        this.camera.position.set(distance, distance, distance);
        this.camera.lookAt(0, 0, 0);
        this.controls.update();
      }
    },
    
    setAutoRotate(value) {
      if (this.controls) {
        this.controls.autoRotate = value;
      }
    }
  }
};
</script>

<style scoped>
.stl-viewer-container {
  position: relative;
  display: inline-block;
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
}

.error-overlay {
  background: rgba(255, 0, 0, 0.1);
  color: #d32f2f;
}
</style>