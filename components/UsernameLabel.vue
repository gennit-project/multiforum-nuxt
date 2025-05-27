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
<<<<<<< HEAD
  <span
    class="mx-2 rounded-md border border-orange-500 bg-orange-100 px-3 pb-1 pt-1.5 text-sm text-orange-600"
    >{{ text }}</span
  >
</template>
=======
  <span class="border border-blue-500 text-blue-600 bg-blue-100 px-3 pt-1.5 pb-1 mx-2 text-sm rounded-md">{{ text }}</span>
</template>
>>>>>>> parent of 666ae3d (Use automated formatting tools)
