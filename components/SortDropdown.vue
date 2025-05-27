<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  setup() {},
  data() {
      return {
          isOpen: false
      }
  }
});
</script>
<template>
  <div class="relative inline-block">
    <div class="flex">
      <button
        id="menu-button"
        type="button"
        class="
          py-2
          group
          inline-flex
          justify-center
          text-sm
          font-medium
          text-gray-700
          hover:text-gray-900
        "
        aria-expanded="false"
        aria-haspopup="true"
        @click="isOpen = !isOpen"
      >
        Sort
        <!-- Heroicon name: solid/chevron-down -->
        <svg
          class="
            flex-shrink-0
            -mr-1
            ml-1
            h-5
            w-5
            text-gray-400
            group-hover:text-gray-500
          "
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
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
      class="
        origin-top-right
        absolute
        right-0
        mt-2
        w-40
        z-20
        rounded-full
        shadow-2xl
         
        ring-1 ring-black ring-opacity-5
        focus:outline-none
      "
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
      tabindex="-1"
    >
      <div
        class="py-1"
        role="none"
      >
        <a
          id="menu-item-0"
          href="#"
          class="font-medium text-gray-900 block px-4 py-2 text-sm"
          role="menuitem"
          tabindex="-1"
        >
          Most Popular
        </a>

        <a
          id="menu-item-1"
          href="#"
          class="text-gray-500 block px-4 py-2 text-sm"
          role="menuitem"
          tabindex="-1"
        >
          Best Rating
        </a>

        <a
          id="menu-item-2"
          href="#"
          class="text-gray-500 block px-4 py-2 text-sm"
          role="menuitem"
          tabindex="-1"
        >
          Newest
        </a>
      </div>
    </div>
  </div>
</template>