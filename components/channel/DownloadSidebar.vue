<script setup lang="ts">
  import PrimaryButton from "@/components/PrimaryButton.vue";

  const handleDownload = () => {
    // Placeholder for download functionality
    console.log("Download initiated");
  };
</script>

<template>
  <div
    class="flex w-80 flex-col space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
  >
    <!-- Price Section -->
    <div class="text-center">
      <div class="text-3xl font-bold text-gray-900 dark:text-white">$0.00</div>
      <div class="text-sm text-gray-500 dark:text-gray-400">Free Download</div>
    </div>

    <!-- Download Button -->
    <PrimaryButton
      class="w-full"
      :label="'Download Now'"
      @click="handleDownload"
    />

    <!-- License Section -->
    <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
      <h3 class="mb-2 text-sm font-medium text-gray-900 dark:text-white">License</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400">placeholder</p>
    </div>
  </div>
</template>
