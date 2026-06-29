<script setup lang="ts">
import { Download, Lock } from 'lucide-vue-next';

defineProps<{
  downloadCount: number;
  suspensionCount: number;
}>();
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2">
    <div class="rounded-lg border border-gray-200 bg-white p-4 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100">
      <Download class="mb-3 h-5 w-5 text-gray-400" />
      <p class="text-2xl font-semibold !text-gray-900 dark:!text-gray-100">
        {{ downloadCount }}
      </p>
      <p class="text-sm text-gray-600 dark:text-gray-300">Downloads</p>
    </div>
    <div class="rounded-lg border border-gray-200 bg-white p-4 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100">
      <Lock class="mb-3 h-5 w-5 text-gray-400" />
      <p class="text-2xl font-semibold !text-gray-900 dark:!text-gray-100">
        {{ suspensionCount }}
      </p>
      <p class="text-sm text-gray-600 dark:text-gray-300">Suspensions</p>
    </div>
  </div>
</template>
