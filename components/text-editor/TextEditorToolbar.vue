<script setup lang="ts">
import EyeSlashIcon from '@/components/icons/EyeSlashIcon.vue';

export type FormatButton = {
  label: string;
  format: string;
  class?: string;
  // Full-word accessible name; falls back to `label` when omitted.
  ariaLabel?: string;
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
  { label: 'B', format: 'bold', ariaLabel: 'Bold' },
  { label: 'I', format: 'italic', ariaLabel: 'Italic' },
  { label: 'U', format: 'underline', ariaLabel: 'Underline' },
  { label: 'H1', format: 'header1', ariaLabel: 'Heading 1' },
  { label: 'H2', format: 'header2', ariaLabel: 'Heading 2' },
  { label: 'H3', format: 'header3', ariaLabel: 'Heading 3' },
  { label: 'Quote', format: 'quote', ariaLabel: 'Quote' },
  {
    label: 'spoiler',
    format: 'spoiler',
    class: 'line-through',
    ariaLabel: 'Spoiler',
  },
  { label: 'Emoji', format: 'emoji', ariaLabel: 'Insert emoji' },
  { label: '⛶', format: 'fullscreen', ariaLabel: 'Toggle fullscreen' },
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
      :aria-label="button.ariaLabel ?? button.label"
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
