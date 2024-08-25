<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    sectionTitle: {
      type: String,
      default: "",
    },
    required: {
      type: Boolean,
      default: false,
    },
  },
  setup() {},
});
</script>

<template>
  <div>
    <label
      v-if="sectionTitle"
      :for="sectionTitle"
      class="font-medium block text-sm leading-6 text-gray-900 dark:text-gray-200"
    >
      {{ sectionTitle }}<span
        v-if="required"
        class="ml-1 text-red-400"
      >*</span>
    </label>
    <div>
      <slot name="content" />
    </div>
  </div>
</template>
<style scoped>
.align-right {
  display: inline-block;
  text-align: right;
}
</style>
