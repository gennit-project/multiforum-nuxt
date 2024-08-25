<script lang="ts">
import { defineComponent } from "vue";
import PrimaryButton from "./PrimaryButton.vue";
import { router } from "@/router";

export default defineComponent({
  components: {
    PrimaryButton
  },
  props: {
    to: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    }
  },
  setup() {
    return { router };
  },
});
</script>
<template>
  <PrimaryButton
    data-testid="primary-button"
    :label="label"
    @click="router.push(to)"
  />
</template>
