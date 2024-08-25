<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    fieldName: {
      type: String,
      required: false,
      default: "",
    },
    label: {
      type: String,
      required: false,
      default: "Add Image",
    },
  },
  setup() {
    return {};
  },
  methods: {
    handleFileChange(event: any) {
      event.preventDefault();
      event.stopPropagation();
      this.$emit("change", event, this.fieldName);
    },
  },
});
</script>

<template>
  <div>
    <label
      :for="`file-input-${fieldName}`"
      class="text-sm flex cursor-pointer items-center text-gray-500 dark:text-gray-300 hover:underline"
    >
      <i class="fa fa-image mr-2" /> {{ label }}
      <input
        :id="`file-input-${fieldName}`"
        ref="fileInput"
        type="file"
        style="display: none"
        @change="handleFileChange"
      >
    </label>
  </div>
</template>
