<script lang="ts">
import { defineComponent } from "vue";
import GenericButton from "@/components/GenericButton.vue";

export default defineComponent({
  components: {
    GenericButton,
  },
  setup() {},
});
</script>

<template>
  <GenericButton
<<<<<<< HEAD
    class="hover:bg-gray-50 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
=======
    text="Cancel"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    :class="[
      'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
      'dark:bg-opacity-60', // class for controlling the background opacity in dark mode
    ]"
    class="font-medium rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    @keydown.enter.prevent
  />
</template>
