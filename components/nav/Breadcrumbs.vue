<script setup lang="ts">
interface Link {
  path?: string;
  label: string;
  current?: boolean;
}

const props = defineProps<{
  links: Link[];
}>();

const buildTarget = (link: Link) => {
  if (!link.path || link.current) {
    return null;
  }

  if (link.path === '/') {
    return '/';
  }

  return link.path.startsWith('/') ? link.path : `/${link.path}/`;
};
</script>

<template>
  <nav class="mb-1 mt-2 flex" aria-label="Breadcrumb">
    <ol role="list" class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <li
        v-for="(link, i) in props.links"
        :key="`${link.path || 'current'}-${link.label}`"
      >
        <div class="flex items-center whitespace-nowrap">
          <!-- Heroicon name: solid/chevron-right -->
          <svg
            v-if="i !== 0"
            class="mr-4 h-5 w-5 flex-shrink-0 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          <nuxt-link
            v-if="buildTarget(link)"
            :to="buildTarget(link)"
            class="text-xs text-gray-500 underline hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
            active-class="text-gray-700 dark:text-white"
          >
            {{ link.label }}
          </nuxt-link>
          <span
            v-else
            aria-current="page"
            class="text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            {{ link.label }}
          </span>
        </div>
      </li>
    </ol>
  </nav>
</template>
