<script lang="ts">
import { defineComponent } from "vue";
import PrimaryButton from "@/components/buttons/PrimaryButton.vue";

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
    :label="text"
    :disabled="disabled"
    :loading="loading"
    class="border-transparent font-medium ml-3 inline-flex justify-center rounded-full border dark:border-gray-700 px-4 py-2 text-sm shadow-sm"
    @keydown.enter.prevent
  />
</template>
