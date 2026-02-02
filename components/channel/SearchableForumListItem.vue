<script lang="ts" setup>
import type { PropType } from 'vue';

type ChannelOption = {
  uniqueName: string;
  displayName: string;
  icon: string;
  description: string;
};

defineProps({
  channel: {
    type: Object as () => ChannelOption,
    required: true,
  },
  selected: {
    type: Array as PropType<string[]>,
    required: true,
  },
});

const emit = defineEmits(['toggleSelection']);
</script>

<template>
  <label class="flex cursor-pointer items-center space-x-3 p-2">
    <input
      type="checkbox"
      :value="channel.uniqueName"
      :checked="selected.includes(channel.uniqueName)"
      :aria-label="`Select ${channel.displayName || channel.uniqueName}`"
      class="h-4 w-4 border border-gray-300 text-orange-600 dark:border-gray-600"
      @change="() => emit('toggleSelection', channel.uniqueName)"
    >
    <div class="flex-1 text-sm">
      <span
        class="font-mono"
        :data-testid="`forum-picker-${channel.uniqueName}`"
      >
        {{ channel.uniqueName }}
      </span>
      <span
        v-if="channel.displayName && channel.displayName !== channel.uniqueName"
        class="text-gray-500 dark:text-gray-400"
      >
        ({{ channel.displayName }})
      </span>
    </div>
  </label>
</template>
