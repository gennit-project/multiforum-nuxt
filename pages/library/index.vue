<script setup lang="ts">
import { useHead } from 'nuxt/app';
import BookmarkIcon from '@/components/icons/BookmarkIcon.vue';

useHead({
  title: 'Library',
});
</script>

<template>
  <div class="hidden py-6 md:block md:px-6 md:py-8">
    <div
      class="from-brand-50 flex h-full min-h-[24rem] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-linear-to-br via-white to-amber-50 px-6 py-10 text-center dark:border-gray-700 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"
    >
      <div class="relative mb-6 h-36 w-full max-w-[18rem]" aria-hidden="true">
        <div
          class="border-brand-200/80 dark:border-brand-500/20 absolute top-6 left-4 h-24 w-32 rounded-2xl border bg-white/90 shadow-sm dark:bg-gray-900/90"
        >
          <div class="px-4 pt-4">
            <div class="mb-3 flex items-center gap-2">
              <div
                class="bg-brand-100 dark:bg-brand-500/20 h-8 w-8 rounded-full"
              />
              <div class="space-y-2">
                <div
                  class="h-2 w-14 rounded-full bg-gray-200 dark:bg-gray-700"
                />
                <div
                  class="h-2 w-10 rounded-full bg-gray-100 dark:bg-gray-800"
                />
              </div>
            </div>
            <div class="space-y-2">
              <div
                class="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800"
              />
              <div
                class="h-2 w-5/6 rounded-full bg-gray-100 dark:bg-gray-800"
              />
            </div>
          </div>
        </div>

        <div
          class="border-brand-300/80 bg-brand-100/80 dark:border-brand-500/30 dark:bg-brand-500/10 absolute top-0 right-5 flex h-24 w-28 items-center justify-center rounded-[1.25rem] border shadow-sm"
        >
          <div class="relative">
            <BookmarkIcon
              class="text-brand-500 dark:text-brand-300 h-12 w-12"
            />
            <div
              class="absolute -top-3 -right-5 h-5 w-5 rounded-full border-2 border-white bg-amber-300 dark:border-gray-900 dark:bg-amber-400"
            />
          </div>
        </div>

        <div
          class="absolute right-8 bottom-2 h-20 w-24 rounded-2xl border border-gray-200/80 bg-white/90 shadow-sm dark:border-gray-700 dark:bg-gray-900/90"
        >
          <div class="px-4 pt-4">
            <div
              class="mb-3 h-2 w-2/3 rounded-full bg-gray-200 dark:bg-gray-700"
            />
            <div class="flex gap-2">
              <div
                class="bg-brand-100 dark:bg-brand-500/15 h-8 flex-1 rounded-xl"
              />
              <div
                class="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-500/15"
              />
            </div>
          </div>
        </div>
      </div>

      <p class="max-w-xs text-sm font-medium text-gray-600 dark:text-gray-300">
        Select a collection to view it.
      </p>
      <p class="mt-2 max-w-sm text-xs text-gray-500 dark:text-gray-400">
        Pick one of your favorites or collections from the side navigation to
        load its items here.
      </p>
    </div>
  </div>
</template>
