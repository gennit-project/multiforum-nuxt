<script setup lang="ts">
import { computed } from 'vue';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';

const uiStore = useUIStore();
const { theme } = storeToRefs(uiStore);

// Computed property to check if theme is dark
const isDarkMode = computed(() => theme.value === 'dark');

// Toggle between light and dark modes
const toggleTheme = () => {
  uiStore.setTheme(isDarkMode.value ? 'light' : 'dark');
};
</script>

<template>
  <client-only>
    <button
      type="button"
      class="border-transparent relative mx-2 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none"
      :class="isDarkMode ? 'bg-gray-700' : 'bg-gray-300'"
      aria-label="Toggle theme"
      role="switch"
      :aria-checked="isDarkMode"
      data-testid="theme-switcher"
      @click="toggleTheme"
    >
      <span class="sr-only">Toggle theme</span>
      <!-- Toggle circle with icon inside -->
      <span
        class="pointer-events-none relative inline-block size-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out"
        :class="[
          isDarkMode ? 'translate-x-5 bg-gray-900' : 'translate-x-0 bg-white',
        ]"
      >
        <!-- Sun icon in light mode -->
        <span
          :class="[
            isDarkMode
              ? 'opacity-0 duration-100 ease-out'
              : 'opacity-100 duration-200 ease-in',
            'absolute inset-0 flex size-full items-center justify-center transition-opacity',
          ]"
          aria-hidden="true"
        >
          <i class="fa-solid fa-sun text-sm text-orange-500" />
        </span>

        <!-- Moon icon in dark mode -->
        <span
          :class="[
            isDarkMode
              ? 'opacity-100 duration-200 ease-in'
              : 'opacity-0 duration-100 ease-out',
            'absolute inset-0 flex size-full items-center justify-center transition-opacity',
          ]"
          aria-hidden="true"
        >
          <i class="fa-solid fa-moon text-sm text-white" />
        </span>
      </span>
    </button>

    <!-- SSR Fallback -->
    <template #fallback>
      <button
        type="button"
        class="border-transparent relative mx-2 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 bg-gray-300 transition-colors duration-200 ease-in-out focus:outline-none dark:bg-gray-700"
        aria-label="Toggle theme"
        role="switch"
        aria-checked="false"
        data-testid="theme-switcher"
      >
        <span class="sr-only">Toggle theme</span>
        <!-- Static toggle circle for SSR -->
        <span
          class="pointer-events-none relative inline-block size-5 translate-x-0 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out dark:translate-x-5 dark:bg-gray-900"
        >
          <!-- Static light mode icon for SSR -->
          <span
            class="absolute inset-0 flex size-full items-center justify-center opacity-100 transition-opacity duration-200 ease-in dark:opacity-0 dark:duration-100 dark:ease-out"
            aria-hidden="true"
          >
            <i class="fa-solid fa-sun text-sm text-orange-500" />
          </span>
          <span
            class="absolute inset-0 flex size-full items-center justify-center opacity-0 transition-opacity duration-100 ease-out dark:opacity-100 dark:duration-200 dark:ease-in"
            aria-hidden="true"
          >
            <i class="fa-solid fa-moon text-sm text-white" />
          </span>
        </span>
      </button>
    </template>
  </client-only>
</template>
