<script setup lang="ts">
const props = defineProps<{
  error?: Error | null;
}>();

const emit = defineEmits<{
  retry: [];
}>();
</script>

<template>
  <div>
    <div v-if="error" class="p-4 mb-4 text-red-700 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200">
      <p>Something went wrong</p>
      <p class="text-sm mt-2">{{ error.message }}</p>
      <button 
        @click="emit('retry')"
        class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
    <slot v-else />
  </div>
</template> 