<script lang="ts" setup>
defineProps({
  message: {
    type: String,
    default: 'Select a discussion to view details.',
  },
});
</script>

<template>
  <div
    class="flex h-full min-h-[20rem] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gradient-to-br from-orange-50 via-white to-amber-50 px-6 py-10 text-center dark:border-gray-700 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"
  >
    <div class="relative mb-6 h-36 w-full max-w-[18rem]" aria-hidden="true">
      <div
        class="absolute left-4 top-6 h-24 w-32 rounded-2xl border border-orange-200/80 bg-white/90 shadow-sm dark:border-orange-500/20 dark:bg-gray-900/90"
      >
        <div class="px-4 pt-4">
          <div class="mb-3 flex items-center gap-2">
            <div class="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-500/20" />
            <div class="space-y-2">
              <div class="h-2 w-14 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div class="h-2 w-10 rounded-full bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
          <div class="space-y-2">
            <div class="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800" />
            <div class="h-2 w-5/6 rounded-full bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
      </div>

      <div
        class="absolute right-5 top-0 flex h-24 w-28 items-center justify-center rounded-[1.25rem] border border-orange-300/80 bg-orange-100/80 shadow-sm dark:border-orange-500/30 dark:bg-orange-500/10"
      >
        <div class="relative">
          <i class="fa-regular fa-comments text-3xl text-orange-500 dark:text-orange-300" />
          <div class="absolute -right-5 -top-3 h-5 w-5 rounded-full border-2 border-white bg-amber-300 dark:border-gray-900 dark:bg-amber-400" />
        </div>
      </div>

      <div
        class="absolute bottom-2 right-8 h-20 w-24 rounded-2xl border border-gray-200/80 bg-white/90 shadow-sm dark:border-gray-700 dark:bg-gray-900/90"
      >
        <div class="px-4 pt-4">
          <div class="mb-3 h-2 w-2/3 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div class="flex gap-2">
            <div class="h-8 flex-1 rounded-xl bg-orange-100 dark:bg-orange-500/15" />
            <div class="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-500/15" />
          </div>
        </div>
      </div>
    </div>

    <p class="max-w-xs text-sm font-medium text-gray-600 dark:text-gray-300">
      {{ message }}
    </p>
    <p class="mt-2 max-w-sm text-xs text-gray-500 dark:text-gray-400">
      Pick an item from the list to load its preview, comments, and channel
      context here.
    </p>
  </div>
</template>
