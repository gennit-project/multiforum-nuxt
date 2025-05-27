<script lang="ts">
import { defineComponent } from "vue";
import PrimaryButton from "@/components/PrimaryButton.vue";

export default defineComponent({
  components: {
    PrimaryButton,
  },
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    text: {
      type: String,
      default: "Save",
    },
  },
  setup() {
  },
});
</script>
<template>
  <PrimaryButton
<<<<<<< HEAD
    class="border-transparent px-4py-2 ml-3 inline-flex justify-center rounded-full border border-gray-300 text-sm font-medium shadow-sm dark:border-gray-700"
    :disabled="disabled"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    :label="text"
    :disabled="disabled"
    :loading="loading"
    class="border-transparent font-medium ml-3 inline-flex justify-center rounded-full border dark:border-gray-700 px-4 py-2 text-sm shadow-sm"
    @keydown.enter.prevent
  />
</template>
