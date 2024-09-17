<script setup lang="ts">
import CreateEvent from "@/components/event/form/CreateEvent.vue";
</script>
<template>
  <NuxtLayout>
    <div class="bg-white dark:bg-black max-w-4xl mx-auto mt-6">
      <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-200">
        Create Event
      </h1>
      <div class="mt-4 text-gray-600 dark:text-gray-400">
        Create an event to share with your community.
      </div>
      <CreateEvent />
    </div>
  </NuxtLayout>
</template>
