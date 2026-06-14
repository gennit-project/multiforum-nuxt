<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PropType } from 'vue';
import { timeAgo } from '@/utils';

// Define local type for LabelChangeHistory until types are regenerated
interface LabelChangeHistoryItem {
  id: string;
  createdAt: string;
  actionType: string;
  labelDisplayName: string;
  labelValue: string;
  ActorUser?: {
    username: string;
    displayName?: string;
  } | null;
  ActorMod?: {
    displayName: string;
  } | null;
}

interface LabelChange {
  id: string;
  actorName: string;
  actionType: string;
  labelDisplayName: string;
  timestamp: Date;
}

const props = defineProps({
  labelChangeHistory: {
    type: Array as PropType<LabelChangeHistoryItem[]>,
    default: () => [],
  },
});

const showOlderChanges = ref(false);

// Process the label change history
const labelChanges = computed((): LabelChange[] => {
  if (!props.labelChangeHistory || props.labelChangeHistory.length === 0) {
    return [];
  }

  return props.labelChangeHistory.map((change) => {
    // Get the actor name - either mod or user
    const actorName =
      change.ActorMod?.displayName ||
      change.ActorUser?.displayName ||
      change.ActorUser?.username ||
      '[Unknown]';

    return {
      id: change.id,
      actorName,
      actionType: change.actionType,
      labelDisplayName: change.labelDisplayName,
      timestamp: new Date(change.createdAt),
    };
  });
});

// Show the section only if there are label changes
const showLabelChanges = computed(() => {
  return labelChanges.value.length > 0;
});

// Get visible items - most recent only, or all if expanded
const visibleItems = computed((): LabelChange[] => {
  if (showOlderChanges.value || labelChanges.value.length <= 1) {
    return labelChanges.value;
  }
  // Show only the most recent (first item since sorted DESC)
  const firstItem = labelChanges.value[0];
  return firstItem ? [firstItem] : [];
});

// Get hidden items count
const hiddenCount = computed(() => {
  return labelChanges.value.length - 1;
});

const toggleOlderChanges = () => {
  showOlderChanges.value = !showOlderChanges.value;
};
</script>

<template>
  <div v-if="showLabelChanges" class="mb-6 mt-4">
    <p class="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
      Label Change History
    </p>
    <ul role="list" class="flow-root">
      <!-- Show older changes button -->
      <li v-if="hiddenCount > 0 && !showOlderChanges" class="relative pb-4">
        <div class="relative flex items-center space-x-3">
          <!-- Vertical line connecting to items below -->
          <div class="relative flex h-6 w-6 items-center justify-center">
            <span
              class="absolute top-3 h-full w-0.5 bg-gray-200 dark:bg-gray-600"
              aria-hidden="true"
            />
          </div>
          <button
            class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            @click="toggleOlderChanges"
          >
            Show {{ hiddenCount }} older change{{ hiddenCount > 1 ? 's' : '' }}
          </button>
        </div>
      </li>

      <li
        v-for="(item, index) in visibleItems"
        :key="item.id"
        class="relative pb-4"
      >
        <div class="relative flex items-center space-x-3">
          <!-- Activity icon with centered vertical line -->
          <div class="relative flex h-6 w-6 items-center justify-center">
            <!-- Vertical line - show above icon if not first visible item -->
            <span
              v-if="index > 0 || (showOlderChanges && hiddenCount > 0)"
              class="absolute bottom-3 h-full w-0.5 bg-gray-200 dark:bg-gray-600"
              aria-hidden="true"
            />
            <!-- Vertical line - show below icon if not last item -->
            <span
              v-if="index < visibleItems.length - 1"
              class="absolute top-3 h-full w-0.5 bg-gray-200 dark:bg-gray-600"
              aria-hidden="true"
            />
            <div
              class="relative z-10 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-800"
              :class="
                item.actionType === 'added'
                  ? 'bg-green-100 dark:bg-green-800'
                  : 'bg-red-100 dark:bg-red-800'
              "
            >
              <i
                v-if="item.actionType === 'added'"
                class="fa-solid fa-plus text-xs text-green-600 dark:text-green-300"
                aria-hidden="true"
              />
              <i
                v-else
                class="fa-solid fa-minus text-xs text-red-600 dark:text-red-300"
                aria-hidden="true"
              />
            </div>
          </div>

          <!-- Activity content -->
          <div class="min-w-0 flex-1">
            <div class="text-xs leading-6">
              <span class="font-medium text-gray-900 dark:text-gray-200">{{
                item.actorName
              }}</span>
              <span class="text-gray-500 dark:text-gray-400">
                {{ item.actionType === 'added' ? ' added the ' : ' removed the ' }}
              </span>
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                :class="
                  item.actionType === 'added'
                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                    : 'bg-red-100 text-red-800 line-through dark:bg-red-800 dark:text-red-200'
                "
              >
                {{ item.labelDisplayName }}
              </span>
              <span class="text-gray-500 dark:text-gray-400"> label </span>
              <span
                class="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400"
              >
                {{ timeAgo(item.timestamp) }}
              </span>
            </div>
          </div>
        </div>
      </li>

      <!-- Hide older changes button -->
      <li v-if="hiddenCount > 0 && showOlderChanges" class="relative">
        <div class="relative flex items-center space-x-3">
          <div class="flex h-6 w-6 items-center justify-center" />
          <button
            class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            @click="toggleOlderChanges"
          >
            Hide older changes
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
