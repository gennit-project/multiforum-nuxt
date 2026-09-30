<script setup lang="ts">
import {
  enteredDevelopmentEnvironmentVar,
  setEnteredDevelopmentEnvironment,
} from '@/cache';

const hideOverlay = () => {
  setEnteredDevelopmentEnvironment(true);
};
</script>

<template>
  <Transition name="fade">
    <div
      v-if="!enteredDevelopmentEnvironmentVar"
      class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
    >
      <div class="mb-8 text-2xl font-bold text-white md:text-4xl">
        This is a remote development environment
      </div>
      <button
        type="button"
        class="bg-brand-600 hover:bg-brand-700 rounded-lg px-8 py-3 text-lg font-semibold text-white transition-colors"
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
