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
    :to="link"
    :data-testid="dataTestid"
    class="inline-flex text-xs gap-2 border border-gray-3 dark:border-gray-600 rounded-lg items-center justify-center px-2 py-1 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
  >
    <LeftArrowIcon class="h-4 w-4" />
    <span v-if="text">{{ text }}</span>
  </nuxt-link>
</template>
