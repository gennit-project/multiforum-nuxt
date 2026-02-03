<script setup lang="ts">
defineProps<{
  latestVersion: string;
  installedVersion?: string | null;
  registryVersions: string[];
  installing: boolean;
}>();

const emit = defineEmits<{
  (e: 'install-latest'): void;
}>();
</script>

<template>
  <div
    class="bg-blue-50 rounded-lg border border-blue-200 p-4 dark:border-blue-800 dark:bg-blue-900/20"
  >
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <i class="fa-solid fa-arrow-circle-up text-xl text-blue-500" />
      </div>
      <div class="ml-3 flex-1">
        <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
          Update Available
        </h3>
        <div class="mt-1 text-sm text-blue-700 dark:text-blue-300">
          <p>
            A newer version is available:
            <span class="font-semibold font-mono">v{{ latestVersion }}</span>
            (currently installed: v{{ installedVersion }})
          </p>
          <p v-if="registryVersions.length > 1" class="mt-1 text-xs">
            {{ registryVersions.length }} versions available in registry
          </p>
        </div>
      </div>
      <div class="ml-4">
        <button
          type="button"
          class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          :disabled="installing"
          @click="emit('install-latest')"
        >
          <i v-if="installing" class="fa-solid fa-spinner mr-1 animate-spin" />
          <i v-else class="fa-solid fa-arrow-up mr-1" />
          Update to v{{ latestVersion }}
        </button>
      </div>
    </div>
  </div>
</template>
