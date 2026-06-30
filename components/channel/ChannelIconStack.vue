<script setup lang="ts">
import { computed } from 'vue';
import AvatarComponent from '@/components/AvatarComponent.vue';

export type ChannelIconStackItem = {
  uniqueName: string;
  iconURL?: string | null;
};

const props = withDefaults(
  defineProps<{
    channels: ChannelIconStackItem[];
    maxVisible?: number;
    iconClass?: string;
    tooltipPositionClass?: string;
    showExtraCount?: boolean;
  }>(),
  {
    maxVisible: 3,
    iconClass:
      'h-8 w-8 shrink-0 rounded-full ring-2 ring-white dark:ring-gray-900',
    tooltipPositionClass:
      'absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover/chicon:opacity-100 dark:bg-gray-700',
    showExtraCount: true,
  }
);

const displayChannels = computed(() => props.channels.slice(0, props.maxVisible));
const extraChannelCount = computed(() =>
  Math.max(0, props.channels.length - props.maxVisible)
);
</script>

<template>
  <div v-if="displayChannels.length" class="flex flex-col items-center gap-1">
    <div class="flex -space-x-2">
      <div
        v-for="channel in displayChannels"
        :key="channel.uniqueName"
        class="group/chicon relative"
      >
        <AvatarComponent
          :class="iconClass"
          :text="channel.uniqueName"
          :src="channel.iconURL || ''"
          :is-small="true"
          :is-square="false"
          :is-decorative="true"
        />
        <span :class="tooltipPositionClass">
          {{ channel.uniqueName }}
        </span>
      </div>
    </div>
    <span
      v-if="showExtraCount && extraChannelCount > 0"
      class="text-center text-[10px] leading-tight text-gray-500 dark:text-gray-400"
    >
      and {{ extraChannelCount }} more
    </span>
  </div>
</template>
