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
});

const emit = defineEmits(['file-change']);

const fileInput = ref<HTMLInputElement | null>(null);


</script>

<template>
  <div>
    <label
      :for="`file-input-${props.fieldName}`"
      class="text-sm flex cursor-pointer items-center text-gray-500 dark:text-gray-300 hover:underline"
    >
      <i class="fa fa-image mr-2" /> {{ props.label }}
      <input
        :id="`file-input-${props.fieldName}`"
        ref="fileInput"
        type="file"
        style="display: none"
        @change="(event: Event) => {
          emit('file-change', {
            event,
            fieldName
          });
        }"
      >
    </label>
  </div>
</template>
