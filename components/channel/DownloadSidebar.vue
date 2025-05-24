<script setup lang="ts">
  import PrimaryButton from "@/components/PrimaryButton.vue";

  const handleDownload = () => {
    // Placeholder for download functionality
    console.log("Download initiated");
  };
</script>

<template>
  <div
    class="flex w-80 flex-col space-y-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
  >
    <!-- 3D Model Viewer (Experiment) -->
    <ModelViewer
      v-if="true"
      :model-url="'https://storage.googleapis.com/listical-dev/models/Tiny_Khopesh_Warrior_Posed_and_Rigged.glb'"
    />
    <div class="p-6">
      <!-- Price Section -->
      <div class="text-left">
        <div class="text-3xl font-bold text-gray-900 dark:text-white">
          <sup class="text-lg">$</sup>0<sup class="text-lg">.00</sup>
        </div>
        <div class="py-2 text-sm text-gray-500 dark:text-gray-400">Free Download</div>
      </div>

      <!-- Download Button -->
      <PrimaryButton
        class="w-full justify-center"
        :label="'Download Now'"
        @click="handleDownload"
      />

      <!-- License Section -->
      <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
        <h3 class="mb-2 text-sm font-medium text-gray-900 dark:text-white">License</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">placeholder</p>
      </div>
    </div>
  </div>
</template>
