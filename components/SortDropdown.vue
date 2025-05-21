<script lang="ts">
  import { defineComponent } from "vue";

  export default defineComponent({
    setup() {},
    data() {
      return {
        isOpen: false,
      };
    },
  });
</script>
<template>
  <div class="relative inline-block">
    <div class="flex">
      <button
        id="menu-button"
        aria-expanded="false"
        aria-haspopup="true"
        class="group inline-flex justify-center py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        type="button"
        @click="isOpen = !isOpen"
      >
        Sort
        <!-- Heroicon name: solid/chevron-down -->
        <svg
          aria-hidden="true"
          class="-mr-1 ml-1 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clip-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            fill-rule="evenodd"
          />
        </svg>
      </button>
    </div>

    <!--
            Dropdown menu, show/hide based on menu state.

            Entering: "transition ease-out duration-100"
              From: "transform opacity-0 scale-95"
              To: "transform opacity-100 scale-100"
            Leaving: "transition ease-in duration-75"
              From: "transform opacity-100 scale-100"
              To: "transform opacity-0 scale-95"
          -->
    <div
      v-if="isOpen"
      aria-labelledby="menu-button"
      aria-orientation="vertical"
      class="absolute right-0 z-20 mt-2 w-40 origin-top-right rounded-full shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none"
      role="menu"
      tabindex="-1"
    >
      <div
        class="py-1"
        role="none"
      >
        <a
          id="menu-item-0"
          class="block px-4 py-2 text-sm font-medium text-gray-900"
          href="#"
          role="menuitem"
          tabindex="-1"
        >
          Most Popular
        </a>

        <a
          id="menu-item-1"
          class="block px-4 py-2 text-sm text-gray-500"
          href="#"
          role="menuitem"
          tabindex="-1"
        >
          Best Rating
        </a>

        <a
          id="menu-item-2"
          class="block px-4 py-2 text-sm text-gray-500"
          href="#"
          role="menuitem"
          tabindex="-1"
        >
          Newest
        </a>
      </div>
    </div>
  </div>
</template>
