<script lang="ts">
import { defineComponent } from "vue";
import IconButtonDropdown from "../buttons/IconButtonDropdown.vue";
import { themeVar } from "@/cache";

export default defineComponent({
  components: {
    IconButtonDropdown,
  },

  setup() {
    // On page load or when changing themes, best to add inline in `head` to avoid FOUC
    // Taken from https://tailwindcss.com/docs/dark-mode

    const updateTheme = () => {
      if (
        localStorage.theme === "dark" ||
        (!("theme" in localStorage) &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        document.body.classList.add("dark");
        document.body.classList.remove("light");
        themeVar("dark");
      } else {
        document.body.classList.add("light");
        document.body.classList.remove("dark");
        themeVar("light");
      }
    };
    updateTheme();
    return {
      updateTheme,
    };
  },
  methods: {
    // Set theme in local storage
    setLightMode() {
      localStorage.setItem("theme", "light");
      this.updateTheme();
    },
    setDarkMode() {
      localStorage.setItem("theme", "dark");
      this.updateTheme();
    },
    setSystemMode() {
      localStorage.removeItem("theme");
      this.updateTheme();
    },
  },
});
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
