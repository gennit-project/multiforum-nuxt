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
  <span
    class="mx-2 rounded-md border border-blue-500 bg-blue-100 px-3 pb-1 pt-1.5 text-sm text-blue-600"
    >{{ text }}</span
  >
</template>
