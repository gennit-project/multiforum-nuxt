<script setup lang="ts">
  import { useRouter } from "nuxt/app";

  const props = defineProps({
    to: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
  });

  const router = useRouter();

  const handleClick = () => {
    router.push(props.to);
  };
</script>

<template>
  <PrimaryButton
    data-testid="primary-button"
    :label="label"
    @click="handleClick"
  />
</template>
