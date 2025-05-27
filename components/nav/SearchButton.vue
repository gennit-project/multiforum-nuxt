<script>
import { defineComponent } from "vue";
import SearchIcon from "@/components/icons/SearchIcon.vue";

export default defineComponent({
  components: {
    SearchIcon,
  },
  setup() {},
});
</script>
<template>
  <button
<<<<<<< HEAD
    class="font-semibold flex h-8 items-center rounded-md border bg-white px-2 text-sm text-black hover:bg-gray-200 focus:outline-none dark:border-gray-300 dark:bg-black dark:text-white dark:hover:bg-gray-600"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    data-testid="create-anything-button"
    class="font-semibold flex h-8 items-center rounded-md border bg-white px-2 text-sm text-black hover:bg-gray-200 focus:outline-none dark:border-gray-800 dark:bg-black dark:text-white dark:hover:bg-gray-600"
  >
    <SearchIcon
      class="h-3 w-3"
      aria-hidden="true"
    />
  </button>
</template>
