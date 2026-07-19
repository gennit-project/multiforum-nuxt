<script setup lang="ts">
import AvatarComponent from '@/components/AvatarComponent.vue';

defineProps<{
  forum: {
    uniqueName: string;
    displayName: string;
    channelIconURL: string;
  };
  active?: boolean;
  compact?: boolean;
}>();

const emit = defineEmits<{
  select: [uniqueName: string];
}>();
</script>

<template>
  <button
    type="button"
    :data-testid="`forum-quick-switcher-option-${forum.uniqueName}`"
    class="group flex w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
    :class="compact ? 'py-1.5' : 'py-2'"
    @click="emit('select', forum.uniqueName)"
  >
    <AvatarComponent
      class="shrink-0 border border-gray-200 shadow-sm dark:border-gray-700"
      :class="compact ? 'h-6 w-6' : 'h-7 w-7'"
      :text="forum.uniqueName"
      :src="forum.channelIconURL"
      :is-small="true"
      :is-square="false"
      :is-decorative="true"
    />
    <span class="min-w-0 flex-1">
      <span class="block truncate font-medium">{{ forum.displayName }}</span>
      <span
        v-if="forum.displayName !== forum.uniqueName"
        class="block truncate font-mono text-xs text-gray-500 dark:text-gray-400"
      >
        {{ forum.uniqueName }}
      </span>
    </span>
    <svg
      v-if="active"
      class="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-label="Current forum"
    >
      <path
        fill-rule="evenodd"
        d="M16.704 5.292a1 1 0 0 1 .004 1.416l-8 8a1 1 0 0 1-1.416 0l-4-4a1 1 0 1 1 1.416-1.416L8 12.584l7.292-7.292a1 1 0 0 1 1.412 0Z"
        clip-rule="evenodd"
      />
    </svg>
  </button>
</template>
