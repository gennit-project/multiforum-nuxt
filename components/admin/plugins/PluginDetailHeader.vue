<script setup lang="ts">
defineProps<{
  pluginDisplayName: string;
  installedVersion?: string | null;
  pluginAuthorName?: string | null;
  pluginAuthorUrl?: string | null;
  pluginLicense?: string | null;
  pluginDescription?: string | null;
  pluginHomepage?: string | null;
  pluginRepoUrl?: string | null;
  pluginTags: string[];
}>();
</script>

<template>
  <div class="flex items-start justify-between">
    <div class="flex-1">
      <div class="flex items-center space-x-3">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ pluginDisplayName }}
        </h1>
        <span
          v-if="installedVersion"
          class="rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        >
          v{{ installedVersion }}
        </span>
      </div>

      <div
        class="mt-1 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400"
      >
        <span v-if="pluginAuthorName">
          by
          <a
            v-if="pluginAuthorUrl"
            :href="pluginAuthorUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-orange-600 hover:underline dark:text-orange-400"
          >
            {{ pluginAuthorName }}
          </a>
          <span v-else>{{ pluginAuthorName }}</span>
        </span>
        <span
          v-if="pluginAuthorName && pluginLicense"
          class="text-gray-400"
          >•</span
        >
        <span
          v-if="pluginLicense"
          class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          {{ pluginLicense }}
        </span>
      </div>

      <p
        v-if="pluginDescription"
        class="mt-2 text-sm text-gray-600 dark:text-gray-400"
      >
        {{ pluginDescription }}
      </p>

      <div class="mt-2 flex items-center space-x-4 text-sm">
        <a
          v-if="pluginHomepage"
          :href="pluginHomepage"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center text-orange-600 hover:underline dark:text-orange-400"
        >
          <i class="fa-solid fa-home mr-1" />
          Homepage
        </a>
        <a
          v-if="pluginRepoUrl"
          :href="pluginRepoUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center text-orange-600 hover:underline dark:text-orange-400"
        >
          <i class="fa-solid fa-code mr-1" />
          View Source
        </a>
      </div>

      <div v-if="pluginTags.length > 0" class="mt-3 flex flex-wrap gap-2">
        <span
          v-for="tag in pluginTags"
          :key="tag"
          class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        >
          {{ tag }}
        </span>
      </div>
    </div>
    <NuxtLink
      to="/admin/plugins"
      class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
    >
      <i class="fa-solid fa-arrow-left mr-2" />
      Back to Plugins
    </NuxtLink>
  </div>
</template>
