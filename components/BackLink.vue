<script lang="ts">
import { defineComponent } from "vue";
import LeftArrowIcon from "@/components/icons/LeftArrowIcon.vue";

export default defineComponent({
  name: "BackLink",
  components: {
    LeftArrowIcon,
  },
  props: {
    link: {
      type: String,
      default: "",
    },
    dataTestid: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      default: "Back",
    },
  },
  setup() {},
});
</script>

<template>
  <nuxt-link
<<<<<<< HEAD
    class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
    :data-testid="dataTestid"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    :to="link"
    :data-testid="dataTestid"
    class="inline-flex text-xs gap-2 border border-gray-3 dark:border-gray-600 rounded-lg items-center justify-center px-2 py-1 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
  >
    <LeftArrowIcon class="h-4 w-4" />
    <span v-if="text">{{ text }}</span>
  </nuxt-link>
</template>
