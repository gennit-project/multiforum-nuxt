<script setup lang="ts">
  import { computed } from "vue";
  import { useUIStore } from "@/stores/uiStore";
  import { storeToRefs } from "pinia";

  const uiStore = useUIStore();
  const { theme } = storeToRefs(uiStore);

  // Computed property to check if theme is dark
  const isDarkMode = computed(() => theme.value === "dark");

  // Toggle between light and dark modes
  const toggleTheme = () => {
    uiStore.setTheme(isDarkMode.value ? "light" : "dark");
  };
</script>

<template>
  <client-only>
    <button
      :aria-checked="isDarkMode"
      aria-label="Toggle theme"
      class="border-transparent relative mx-2 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none"
      :class="isDarkMode ? 'bg-gray-700' : 'bg-gray-600'"
      data-testid="theme-switcher"
      role="switch"
      @click="toggleTheme"
    >
      <span class="sr-only">Toggle theme</span>
      <!-- Toggle circle with icon inside -->
      <span
        class="pointer-events-none relative inline-block size-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out"
        :class="[isDarkMode ? 'translate-x-5 bg-gray-900' : 'translate-x-0 bg-gray-800']"
      >
        <!-- Sun icon in light mode -->
        <span
          aria-hidden="true"
          :class="[
            isDarkMode ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in',
            'absolute inset-0 flex size-full items-center justify-center transition-opacity',
          ]"
        >
          <i class="fa-solid fa-sun text-sm text-white" />
        </span>

        <!-- Moon icon in dark mode -->
        <span
          aria-hidden="true"
          :class="[
            isDarkMode ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out',
            'absolute inset-0 flex size-full items-center justify-center transition-opacity',
          ]"
        >
          <i class="fa-solid fa-moon text-sm text-white" />
        </span>
      </span>
    </button>

    <!-- SSR Fallback -->
    <template #fallback>
      <button
        aria-label="Toggle theme"
        class="border-transparent relative mx-2 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 bg-gray-700 transition-colors duration-200 ease-in-out focus:outline-none"
        data-testid="theme-switcher"
        role="switch"
      >
        <span class="sr-only">Toggle theme</span>
        <!-- Static toggle circle for SSR -->
        <span
          class="pointer-events-none relative inline-block size-5 translate-x-5 transform rounded-full bg-gray-900 shadow ring-0 transition duration-200 ease-in-out"
        >
          <!-- Static dark mode icon for SSR -->
          <span
            aria-hidden="true"
            class="absolute inset-0 flex size-full items-center justify-center opacity-0 transition-opacity duration-100 ease-out"
          >
            <i class="fa-solid fa-sun text-sm text-white" />
          </span>
          <span
            aria-hidden="true"
            class="absolute inset-0 flex size-full items-center justify-center opacity-100 transition-opacity duration-200 ease-in"
          >
            <i class="fa-solid fa-moon text-sm text-white" />
          </span>
        </span>
      </button>
    </template>
  </client-only>
</template>
