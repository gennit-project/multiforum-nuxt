<script setup>
  import { useUIStore } from "@/stores/uiStore";
  import { onMounted } from "vue";

  const uiStore = useUIStore();

  // Initialize theme class on application load
  onMounted(() => {
    // Force theme application on initial load
    if (uiStore.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  });
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
