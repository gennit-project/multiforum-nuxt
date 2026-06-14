<script lang="ts" setup>
import ImageReportsList from '@/components/admin/ImageReportsList.vue';
</script>

<template>
  <div class="flex-col space-y-4 dark:text-white">
    <div class="mb-6">
      <h1 class="mb-2 text-xl font-bold">Image Reports</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        These are reports submitted against images, including album images,
        profile pictures, and channel icons/banners.
      </p>
      <ul
        class="ml-4 mt-2 list-outside list-disc text-sm text-gray-600 dark:text-gray-400"
      >
        <li>
          <span class="font-medium text-orange-700 dark:text-orange-300"
            >Album Image</span
          >
          - Images in discussion albums (channel-scoped)
        </li>
        <li>
          <span class="font-medium text-purple-700 dark:text-purple-300"
            >Profile Picture</span
          >
          - User profile pictures (server-scoped)
        </li>
        <li>
          <span class="font-medium text-blue-700 dark:text-blue-300"
            >Channel Icon/Banner</span
          >
          - Forum icons and banners (server-scoped)
        </li>
      </ul>
    </div>
    <FormRow>
      <template #content>
        <ImageReportsList />
      </template>
    </FormRow>
  </div>
</template>
