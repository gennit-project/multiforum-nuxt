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
    setup() {},
  });
</script>
<template>
  <PrimaryButton
    class="border-transparent px-4py-2 ml-3 inline-flex justify-center rounded-full border border-black text-sm font-medium shadow-sm dark:border-gray-700"
    :disabled="disabled"
    :label="text"
    :loading="loading"
    @keydown.enter.prevent
  />
</template>
