<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  enableBack: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['clickBack']);
</script>

<template>
  <div class="flex w-full flex-col space-y-4">
    <span
      v-if="props.enableBack"
      class="cursor-pointer underline"
      @click="emit('clickBack')"
    >
      Back
    </span>
    <h2 class="text-md font-bold">{{ props.title }}</h2>
    <slot />
  </div>
</template>
