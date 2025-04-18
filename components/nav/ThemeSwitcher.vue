<script setup lang="ts">
import { useUIStore } from '@/stores/uiStore';
const uiStore = useUIStore();

const setLightMode = () => {
  uiStore.setTheme('light');
};

const setDarkMode = () => {
  uiStore.setTheme('dark');
};

const setSystemMode = () => {
  uiStore.setTheme('system');
};
</script>

<template>
  <IconButtonDropdown
    :dark-background="true"
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
