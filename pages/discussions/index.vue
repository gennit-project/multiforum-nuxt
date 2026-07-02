<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

const ClientSearchDiscussions = import.meta.client
  ? defineAsyncComponent(
      () => import('@/components/discussion/list/SearchDiscussions.vue')
    )
  : null;
</script>

<template>
  <NuxtLayout>
    <ClientOnly>
      <component
        :is="ClientSearchDiscussions"
        v-if="ClientSearchDiscussions"
        :is-forum-scoped="false"
      />
      <template #fallback>
        <div class="mx-auto w-full max-w-5xl px-4 py-6">
          <div class="space-y-3">
            <div class="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div class="h-24 rounded-lg bg-gray-100 dark:bg-gray-900" />
            <div class="h-24 rounded-lg bg-gray-100 dark:bg-gray-900" />
            <div class="h-24 rounded-lg bg-gray-100 dark:bg-gray-900" />
          </div>
        </div>
      </template>
    </ClientOnly>
  </NuxtLayout>
</template>

<style scoped></style>
