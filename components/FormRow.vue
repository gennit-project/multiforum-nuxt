<script lang="ts" setup>
import { useId } from 'vue';

defineProps({
  sectionTitle: {
    type: String,
    default: '',
  },
  dangerous: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
});

// The label previously pointed `for` at the section title text (spaces and all),
// which never matches a real control id. Use a valid generated id instead and
// expose it to the content slot so callers can bind it to their input for a
// proper label association.
const fieldId = useId();
</script>

<template>
  <div class="mb-2">
    <label
      v-if="sectionTitle"
      :for="fieldId"
      :class="dangerous ? 'text-red-400' : 'text-gray-900 dark:text-gray-200'"
      class="block text-sm font-medium leading-6"
    >
      {{ sectionTitle }}<span v-if="required" class="ml-1 text-red-400">*</span>
    </label>
    <p
      v-if="description"
      class="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400"
    >
      {{ description }}
    </p>
    <div>
      <slot name="content" v-bind="$attrs" :field-id="fieldId" />
    </div>
  </div>
</template>
<style scoped>
.align-right {
  display: inline-block;
  text-align: right;
}
</style>
