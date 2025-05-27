<script lang="ts">
import type { PropType } from "vue";
import { defineComponent } from "vue";

interface Link {
  path: string;
  label: string;
}

export default defineComponent({
  name: "BreadCrumbs",
  props: {
    links: {
      type: Array as PropType<Link[]>,
      required: true,
    },
  },
  setup() {
    return {};
  },
});
</script>

<template>
  <nav
    class="mb-1 mt-2 flex"
    aria-label="Breadcrumb"
  >
    <ol
      role="list"
      class="flex items-center space-x-4"
    >
      <li
        v-for="(link, i) in links"
        :key="link.path"
      >
        <div class="flex items-center">
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
            v-if="link.path"
            :to="`/${link.path}/`"
            class="text-xs text-gray-500 underline hover:text-gray-700"
            active-class="text-gray-700"
          >
            {{ link.label }}
          </nuxt-link>
        </div>
      </li>
    </ol>
  </nav>
</template>
