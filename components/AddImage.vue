<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  fieldName: {
    type: String,
    required: true,
    default: "",
  },
  label: {
    type: String,
    required: false,
    default: "Add Image",
  },
  disabled: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const emit = defineEmits(['file-change']);

const fileInput = ref<HTMLInputElement | null>(null);


</script>

<template>
  <div>
    <label
      :for="`file-input-${props.fieldName}`"
      :class="[
        'text-sm inline-flex items-center px-3 py-1.5 rounded-md transition-colors',
        !disabled ? 
          'cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800' : 
          'opacity-60 cursor-not-allowed bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
      ]"
    >
      <i class="fa fa-image mr-2" /> {{ props.label }}
      <input
        :id="`file-input-${props.fieldName}`"
        ref="fileInput"
        type="file"
        accept="image/*"
        style="display: none"
        :disabled="disabled"
        @change="(event: Event) => {
          if (!disabled) {
            emit('file-change', {
              event,
              fieldName
            });
          }
        }"
      >
    </label>
  </div>
</template>
