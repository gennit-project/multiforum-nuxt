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

// Force iOS to properly recognize this as an image upload input
const clearFileInput = () => {
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// For mobile browsers that might not properly cleanup
const onFileSelected = (event: Event) => {
  if (props.disabled) return;
  
  const input = event.target as HTMLInputElement;
  if (input && input.files && input.files.length > 0) {
    console.log(`File selected: ${input.files[0].name}, type: ${input.files[0].type}, size: ${input.files[0].size}`);
  }
  
  emit('file-change', {
    event,
    fieldName: props.fieldName
  });
  
  // Set a timeout to clear the input after the event has been processed
  // This ensures the same file can be selected again on mobile
  setTimeout(clearFileInput, 500);
};

</script>

<template>
  <div>
    <label
<<<<<<< HEAD
      :class="[
        'my-1 inline-flex items-center rounded-md border border-orange-400 px-3 py-1 py-1.5 text-sm transition-colors dark:border-orange-800',
        !disabled
          ? 'cursor-pointer bg-orange-100 text-orange-600 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-200 dark:hover:bg-orange-800'
          : 'cursor-not-allowed bg-gray-100 text-gray-500 opacity-60 dark:bg-gray-700 dark:text-gray-400',
      ]"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
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
        @change="onFileSelected"
        @click="clearFileInput"
      >
    </label>
  </div>
</template>
