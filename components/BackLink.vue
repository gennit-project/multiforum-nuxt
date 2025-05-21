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
    class="border-gray-3 inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
    :data-testid="dataTestid"
    :to="link"
  >
    <LeftArrowIcon class="h-4 w-4" />
    <span v-if="text">{{ text }}</span>
  </nuxt-link>
</template>
