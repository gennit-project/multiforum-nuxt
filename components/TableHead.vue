<script lang="ts">
  import { defineComponent } from "vue";

  export default defineComponent({
    setup() {},
  });
</script>
<template>
  <th
    class="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
    scope="col"
  >
    <slot />
  </th>
</template>
