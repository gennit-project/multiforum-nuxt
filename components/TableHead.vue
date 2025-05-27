<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  setup() {},
});
</script>
<template>
  <th
    scope="col"
    class="
      px-2
      py-2
      text-left text-xs
      font-medium
      text-gray-500
      uppercase
      tracking-wider
    "
  >
    <slot />
  </th>
</template>