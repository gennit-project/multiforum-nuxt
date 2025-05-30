<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "UsernameLabel",
  props: {
    text: {
      type: String,
      required: true,
    },
  },
});
</script>
<template>
  <span class="border border-orange-500 text-orange-600 bg-orange-100 px-3 pt-1.5 pb-1 mx-2 text-sm rounded-md">{{ text }}</span>
</template>