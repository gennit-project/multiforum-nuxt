<script setup lang="ts">
import EyeSlashIcon from '@/components/icons/EyeSlashIcon.vue';

export type FormatButton = {
  label: string;
  format: string;
  class?: string;
};

const props = defineProps<{
  showFullscreenButton?: boolean;
}>();

const emit = defineEmits<{
  format: [format: string];
  'toggle-emoji': [event: MouseEvent];
  'toggle-fullscreen': [];
}>();

const formatButtons: FormatButton[] = [
  { label: 'B', format: 'bold' },
  { label: 'I', format: 'italic' },
  { label: 'U', format: 'underline' },
  { label: 'H1', format: 'header1' },
  { label: 'H2', format: 'header2' },
  { label: 'H3', format: 'header3' },
  { label: 'Quote', format: 'quote' },
  { label: 'spoiler', format: 'spoiler', class: 'line-through' },
  { label: 'Emoji', format: 'emoji' },
  { label: '⛶', format: 'fullscreen' },
];

const visibleButtons = props.showFullscreenButton
  ? formatButtons
  : formatButtons.filter((b) => b.format !== 'fullscreen');

const handleButtonClick = (button: FormatButton, event: MouseEvent) => {
  if (button.format === 'emoji') {
    emit('toggle-emoji', event);
  } else if (button.format === 'fullscreen') {
    emit('toggle-fullscreen');
  } else {
    emit('format', button.format);
  }
};
</script>

<template>
  <div class="flex flex-wrap items-center space-x-1">
    <button
      v-for="button in visibleButtons"
      :key="button.label"
      type="button"
      :aria-label="button.label"
      :class="[
        'border-transparent text-md rounded-md px-2 py-1 font-medium hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
        button.class,
      ]"
      @click.prevent="handleButtonClick(button, $event)"
    >
      <EyeSlashIcon
        v-if="button.format === 'spoiler'"
        class="h-4 w-4"
        aria-hidden="true"
      />
      <span v-else>{{ button.label }}</span>
    </button>
  </div>
</template>
