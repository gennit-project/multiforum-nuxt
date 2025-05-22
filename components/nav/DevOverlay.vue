<script setup lang="ts">
  import { enteredDevelopmentEnvironmentVar, setEnteredDevelopmentEnvironment } from "@/cache";

  const hideOverlay = () => {
    setEnteredDevelopmentEnvironment(true);
  };
</script>

<template>
  <Transition name="fade">
    <div
      v-if="!enteredDevelopmentEnvironmentVar"
      class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90"
    >
      <div class="mb-8 text-2xl font-bold text-white md:text-4xl">
        This is a remote development environment
      </div>
      <button
        class="font-semibold bg-orange-600 hover:bg-orange-700 rounded-lg px-8 py-3 text-lg text-white transition-colors"
        type="button"
        @click="hideOverlay"
      >
        Enter
      </button>
    </div>
  </Transition>
</template>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
