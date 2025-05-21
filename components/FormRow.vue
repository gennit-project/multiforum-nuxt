<script lang="ts" setup>
  defineProps({
    sectionTitle: {
      type: String,
      default: "",
    },
    dangerous: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: "",
    },
    required: {
      type: Boolean,
      default: false,
    },
  });
</script>

<template>
  <div class="px-1 sm:px-2">
    <label
      v-if="sectionTitle"
      class="block text-sm font-medium leading-6"
      :class="dangerous ? 'text-red-400' : 'text-gray-900 dark:text-gray-200'"
      :for="sectionTitle"
    >
      {{ sectionTitle
      }}<span
        v-if="required"
        class="ml-1 text-red-400"
        >*</span
      >
    </label>
    <p
      v-if="description"
      class="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400"
    >
      {{ description }}
    </p>
    <div>
      <slot
        name="content"
        v-bind="$attrs"
      />
    </div>
  </div>
</template>
<style scoped>
  .align-right {
    display: inline-block;
    text-align: right;
  }
</style>
