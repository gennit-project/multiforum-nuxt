<script lang="ts">
import { defineComponent } from "vue";
import MarkdownLoader from "@/components/legal/MarkdownLoader.vue";

export default defineComponent({
  components: {
    MarkdownLoader,
  },
  setup() {
    return {};
  },
});
</script>

<template>
  <MarkdownLoader slug="terms/terms-of-use" />
</template>
