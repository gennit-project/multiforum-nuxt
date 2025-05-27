<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "HamburgerMenuButton",
  setup() {},
});
</script>
<template>
  <button
    data-testid="hamburger-menu-button"
    type="button"
    class="bg-black inline-flex border border-gray-700 items-center justify-center rounded-md p-2 text-gray-300 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-700  hover:text-white"
    aria-controls="mobile-menu"
    aria-expanded="false"
  >
    <span class="sr-only">Open site-wide navigation menu</span>
    <svg
      class="block h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
    <svg
      class="hidden h-6 w-6"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </button>
</template>
