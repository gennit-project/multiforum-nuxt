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
    class="mx-2 rounded-md border border-orange-500 bg-orange-100 px-3 pb-1 pt-1.5 text-sm text-orange-600"
    >{{ text }}</span
  >
</template>
