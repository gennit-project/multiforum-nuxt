<script setup lang="ts">
import { ref, computed } from "vue";

defineProps<{
  text: string;
  delay?: number;
}>();

const isVisible = ref(false);
const timeoutId = ref<NodeJS.Timeout | null>(null);

const showTooltip = () => {
  if (timeoutId.value) {
    clearTimeout(timeoutId.value);
  }
  isVisible.value = true;
};

const hideTooltip = () => {
  if (timeoutId.value) {
    clearTimeout(timeoutId.value);
    timeoutId.value = null;
  }
  isVisible.value = false;
};
</script>

<template>
  <div class="relative inline-block">
    <!-- Slot for the icon/button -->
    <div
      @mouseenter="showTooltip"
      @mouseleave="hideTooltip"
      @focus="showTooltip"
      @blur="hideTooltip"
    >
      <slot />
    </div>

    <!-- Tooltip -->
    <ClientOnly>
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 translate-x-1 scale-95"
        enter-to-class="opacity-100 translate-x-0 scale-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-x-0 scale-100"
        leave-to-class="opacity-0 translate-x-1 scale-95"
      >
        <div
          v-if="isVisible"
          class="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 z-50 pointer-events-none"
        >
          <!-- Tooltip content -->
          <div class="relative bg-gray-800 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            {{ text }}
            
            <!-- Left-pointing arrow -->
            <svg 
              class="absolute right-full top-1/2 transform -translate-y-1/2 text-gray-800" 
              width="6" 
              height="12" 
              viewBox="0 0 6 12" 
              fill="currentColor"
            >
              <path d="M6 0 L0 6 L6 12 Z" />
            </svg>
          </div>
        </div>
      </Transition>
    </ClientOnly>
  </div>
</template>