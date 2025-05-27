<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    setup(){}
})
</script>
<template>
  <h1 class="pt-2 text-lg font-medium text-gray-900 dark:text-gray-200">
    <slot />
  </h1>
</template>