<script setup lang="ts">
import {
  enteredDevelopmentEnvironmentVar,
  setEnteredDevelopmentEnvironment,
} from "@/cache";

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
      <div class="text-white text-2xl md:text-4xl font-bold mb-8">
        This is a remote development environment
      </div>
      <button
        type="button"
        @click="hideOverlay"
        class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg font-semibold transition-colors"
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
