<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: "TableComponent",
    setup(){}
})
</script>
<template>
  <table class="table-auto min-w-full divide-y divide-gray-200">
    <thead class="bg-gray-50">
      <slot name="head" />
    </thead>
    <tbody>
      <slot name="body" />
    </tbody>
  </table>
</template>