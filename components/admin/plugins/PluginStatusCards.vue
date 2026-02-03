<script setup lang="ts">
defineProps<{
  isEnabled: boolean;
  installedVersion?: string | null;
  canEnable: boolean;
  enabling: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle-enabled', enabled: boolean): void;
}>();
</script>

<template>
  <div class="space-y-4">
    <div
      class="rounded-xl border-2 border-green-300 bg-green-50 p-6 dark:border-green-700 dark:bg-green-900/30"
    >
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
            <i class="fa-solid fa-check text-2xl text-green-600 dark:text-green-300" />
          </div>
        </div>
        <div class="ml-4">
          <p class="text-lg font-semibold text-green-800 dark:text-green-200">
            Plugin Installed
          </p>
          <p class="text-sm text-green-700 dark:text-green-300">
            Version <span class="font-mono font-semibold">v{{ installedVersion }}</span>
          </p>
        </div>
      </div>
    </div>

    <div
      :class="[
        'rounded-xl border-2 p-6 transition-all',
        isEnabled
          ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30'
          : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50'
      ]"
    >
      <div v-if="isEnabled" class="flex items-center justify-between">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
              <i class="fa-solid fa-power-off text-2xl text-blue-600 dark:text-blue-300" />
            </div>
          </div>
          <div class="ml-4">
            <p class="text-lg font-semibold text-blue-800 dark:text-blue-200">
              Plugin Enabled
            </p>
            <p class="text-sm text-blue-700 dark:text-blue-300">
              Running server-wide
            </p>
          </div>
        </div>
        <button
          type="button"
          class="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-blue-600 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700"
          :disabled="enabling"
          @click="emit('toggle-enabled', false)"
        >
          <i v-if="enabling" class="fa-solid fa-spinner mr-2 animate-spin" />
          Disable
        </button>
      </div>

      <div v-else class="flex flex-col items-center text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
          <i class="fa-solid fa-power-off text-2xl text-gray-500 dark:text-gray-400" />
        </div>
        <p class="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
          Plugin Disabled
        </p>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {{ canEnable ? 'Ready to enable' : 'Configure required secrets first' }}
        </p>
        <button
          v-if="canEnable"
          type="button"
          class="mt-4 w-full rounded-lg bg-green-700 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="enabling"
          @click="emit('toggle-enabled', true)"
        >
          <i v-if="enabling" class="fa-solid fa-spinner mr-2 animate-spin" />
          <i v-else class="fa-solid fa-power-off mr-2" />
          Enable Plugin
        </button>
        <p v-if="canEnable" class="mt-3 text-xs text-gray-500 dark:text-gray-400">
          <i class="fa-solid fa-info-circle mr-1" />
          After enabling, restart the backend for changes to take effect
        </p>
        <p v-else class="mt-3 text-xs text-gray-500 dark:text-gray-400">
          <i class="fa-solid fa-lock mr-1" />
          Configure secrets below to enable
        </p>
      </div>
    </div>
  </div>
</template>
