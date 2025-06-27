<script setup lang="ts">
import type { PropType } from "vue";
import type { Discussion } from "@/__generated__/graphql";
import { PriceModel } from "@/__generated__/graphql";
import PrimaryButton from "@/components/PrimaryButton.vue";
import { computed } from "vue";

const props = defineProps({
  discussion: {
    type: Object as PropType<Discussion>,
    required: false,
  },
});

// Get the primary downloadable file (first one)
const primaryFile = computed(() => {
  return props.discussion?.DownloadableFiles?.[0] || null;
});

// Format price display
const priceDisplay = computed(() => {
  if (!primaryFile.value) return { main: "$0", sub: "00", label: null };
  
  if (primaryFile.value.priceModel === PriceModel.Free) {
    return { main: "$0", sub: "00", label: null };
  }
  
  const cents = primaryFile.value.priceCents || 0;
  const dollars = Math.floor(cents / 100);
  const remainingCents = cents % 100;
  
  return {
    main: `$${dollars}`,
    sub: remainingCents.toString().padStart(2, '0'),
    label: "Purchase"
  };
});

// Get license info
const licenseInfo = computed(() => {
  return primaryFile.value?.license?.name || "No license specified";
});

const handleDownload = () => {
  if (!primaryFile.value?.url) {
    console.error("No download URL available");
    return;
  }
  
  // Create a temporary anchor element to trigger download
  const link = document.createElement('a');
  link.href = primaryFile.value.url;
  link.download = primaryFile.value.fileName || 'download';
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <div
    class="flex w-80 flex-col space-y-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="p-6">
      <!-- Boxed Info Section -->
      <div v-if="primaryFile" class="mb-4 p-4 rounded-lg border border-orange-400 bg-gray-50 dark:border-orange-500 dark:bg-gray-700">
        <!-- File Name -->
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
          {{ primaryFile.fileName }}
        </h3>
        <!-- File Type and Size -->
        <div class="text-sm text-gray-600 dark:text-gray-300 mb-3">
          {{ primaryFile.kind }} • {{ (primaryFile.size / (1024 * 1024)).toFixed(2) }}MB
        </div>
        
        <!-- Price Section -->
        <div class="text-left mb-3">
          <div class="text-3xl font-bold text-gray-900 dark:text-white">
            <sup class="text-lg">{{ priceDisplay.main.charAt(0) }}</sup>{{ priceDisplay.main.slice(1) }}<sup class="text-lg">.{{ priceDisplay.sub }}</sup>
          </div>
          <div v-if="priceDisplay.label" class="py-1 text-sm text-gray-500 dark:text-gray-400">
            {{ priceDisplay.label }}
          </div>
        </div>

        <!-- Available Instantly -->
        <div class="text-sm font-medium text-green-600 dark:text-green-400">
          Available Instantly
        </div>
      </div>

      <!-- Download Button -->
      <PrimaryButton
        class="w-full justify-center"
        :label="'Download Now'"
        :disabled="!primaryFile"
        @click="handleDownload"
      />
      <div v-if="priceDisplay.label === 'Free Download'" class="text-xs mt-2 text-gray-500 dark:text-gray-400">
        By downloading, you agree to the content license
      </div>
      <div v-else class="text-xs mt-2 text-gray-500 dark:text-gray-400">
        By placing an order, you're purchasing a content license
      </div>

      <!-- License Section -->
      <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
        <h3 class="mb-2 text-sm font-medium text-gray-900 dark:text-white">
          License
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ licenseInfo }}</p>
      </div>

      <!-- No File Available -->
      <div v-if="!primaryFile" class="text-center text-gray-500 dark:text-gray-400">
        No downloadable files available
      </div>
    </div>
  </div>
</template>
