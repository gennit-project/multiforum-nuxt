<script setup lang="ts">
defineProps({
  setupUrl: {
    type: String,
    default: '/admin/setup#maps',
  },
  statusUnavailable: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div
    class="flex h-full min-h-64 items-center justify-center bg-gray-100 p-6 dark:bg-gray-900"
    data-testid="map-unavailable"
  >
    <div
      class="max-w-md rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <h2 class="font-semibold text-lg text-gray-900 dark:text-white">
        {{
          statusUnavailable
            ? 'Map availability could not be checked'
            : 'Map is not configured'
        }}
      </h2>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {{
          statusUnavailable
            ? 'The event list remains available while the instance setup status is unavailable.'
            : 'Add the Google Maps configuration to enable the interactive event map.'
        }}
      </p>
      <div class="mt-4 flex flex-wrap justify-center gap-3 text-sm font-medium">
        <NuxtLink
          :to="setupUrl"
          class="text-orange-700 hover:underline dark:text-orange-300"
        >
          Open instance setup
        </NuxtLink>
        <NuxtLink
          to="/events/list/search"
          class="text-gray-700 hover:underline dark:text-gray-200"
        >
          Browse events as a list
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
