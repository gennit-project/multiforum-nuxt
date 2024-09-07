<script setup lang="ts">
import { onMounted } from 'vue';
import { themeVar } from '@/cache';

// Function to update the theme
const updateTheme = () => {
  if (import.meta.client) {
    if (
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      themeVar('dark');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
      themeVar('light');
    }
  }
};

// Update theme on component mount (client-side only)
onMounted(() => {
  updateTheme();
});

const setLightMode = () => {
  if (import.meta.client) {
    localStorage.setItem('theme', 'light');
    updateTheme();
  }
};

const setDarkMode = () => {
  if (import.meta.client) {
    localStorage.setItem('theme', 'dark');
    updateTheme();
  }
};

const setSystemMode = () => {
  if (import.meta.client) {
    localStorage.removeItem('theme');
    updateTheme();
  }
};
</script>

<template>
  <IconButtonDropdown
    :menu-button-icon="'fa-regular fa-sun'"
    :items="[
      {
        label: 'Light Mode',
        icon: 'fa-regular fa-sun',
        event: 'lightMode',
        value: '',
      },
      {
        label: 'Dark Mode',
        icon: 'fa-regular fa-moon',
        event: 'darkMode',
        value: '',
      },
      {
        label: 'Device Default',
        icon: 'fa-solid fa-desktop',
        event: 'systemMode',
        value: '',
      },
    ]"
    @light-mode="setLightMode"
    @dark-mode="setDarkMode"
    @system-mode="setSystemMode"
  />
</template>
