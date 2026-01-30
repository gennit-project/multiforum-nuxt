<script setup lang="ts">
import { ref, nextTick } from 'vue';

defineProps<{
  text: string;
  delay?: number;
}>();

const isVisible = ref(false);
const timeoutId = ref<NodeJS.Timeout | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const tooltipPosition = ref({ top: 0, left: 0 });

const updatePosition = () => {
  if (!triggerRef.value) return;
  const rect = triggerRef.value.getBoundingClientRect();
  tooltipPosition.value = {
    top: rect.top + rect.height / 2,
    left: rect.right + 8, // 8px gap (ml-2 equivalent)
  };
};

const showTooltip = async () => {
  if (timeoutId.value) {
    clearTimeout(timeoutId.value);
  }
  updatePosition();
  isVisible.value = true;
  await nextTick();
  updatePosition(); // Update again after render
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
      ref="triggerRef"
      @mouseenter="showTooltip"
      @mouseleave="hideTooltip"
      @focus="showTooltip"
      @blur="hideTooltip"
    >
      <slot />
    </div>

    <!-- Tooltip rendered at body level to escape stacking context -->
    <ClientOnly>
      <Teleport to="body">
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
            class="pointer-events-none fixed z-[100] -translate-y-1/2 transform"
            :style="{
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
            }"
          >
            <!-- Tooltip content -->
            <div
              class="relative whitespace-nowrap rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white shadow-lg"
            >
              {{ text }}

              <!-- Left-pointing arrow -->
              <svg
                class="absolute right-full top-1/2 -translate-y-1/2 transform text-gray-800"
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
      </Teleport>
    </ClientOnly>
  </div>
</template>
