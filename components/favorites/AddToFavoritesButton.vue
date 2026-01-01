<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import AddToListPopover from '@/components/collection/AddToListPopover.vue';

const props = defineProps({
  isFavorited: {
    type: Boolean,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  displayName: {
    type: String,
    default: '',
  },
  entityType: {
    type: String,
    default: 'item',
  },
  size: {
    type: String,
    default: 'medium',
  },
  allowAddToList: {
    type: Boolean,
    default: true,
  },
  itemId: {
    type: String,
    default: '',
  },
});

const emit = defineEmits<{
  toggle: [];
}>();

const isAnimating = ref(false);
const showTooltip = ref(false);
const showPopover = ref(false);
const tooltipPosition = ref({
  top: 0,
  left: 0,
  placement: 'below' as 'below' | 'above',
});

type PopoverPosition = {
  top: number;
  left: number;
  placement?: 'above' | 'below';
  triggerRect?: {
    top: number;
    bottom: number;
    height: number;
    width: number;
  };
};

const popoverPosition = ref<PopoverPosition>({
  top: 0,
  left: 0,
  placement: 'below',
  triggerRect: {
    top: 0,
    bottom: 0,
    height: 0,
    width: 0,
  },
});
const buttonRef = ref<HTMLElement>();
const tooltipRef = ref<HTMLElement>();

const handleClick = () => {
  if (props.isLoading) return;

  const shouldOpenPopover = props.allowAddToList && props.isFavorited;

  if (shouldOpenPopover) {
    // Already favorited – open collection popover
    showPopover.value = !showPopover.value;
    if (showPopover.value) {
      nextTick(() => updatePopoverPosition());
    }
    return;
  }

  // Traditional favorites toggle
  showPopover.value = false;
  emit('toggle');

  // Start animation if toggling to favorited
  if (!props.isFavorited) {
    isAnimating.value = true;
    setTimeout(() => {
      isAnimating.value = false;
    }, 300);
  }
};

const updatePopoverPosition = async () => {
  if (!buttonRef.value || !showPopover.value) return;

  await nextTick();

  const buttonRect = buttonRef.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const popoverWidth = 320; // Width of the popover
  const popoverHeight = 400; // Estimated height of the popover

  // Calculate position
  let left = buttonRect.left;
  let top = buttonRect.bottom + 8; // 8px spacing below button
  let placement: 'above' | 'below' = 'below';

  // Check if popover would go off the right edge
  if (left + popoverWidth > viewportWidth - 10) {
    left = buttonRect.right - popoverWidth; // Align to right edge of button
  }

  // Check if popover would go off the bottom edge
  if (top + popoverHeight > viewportHeight - 10) {
    top = buttonRect.top - popoverHeight - 8; // Position above button
    placement = 'above';
  }

  // Ensure it doesn't go off the left edge
  if (left < 10) {
    left = 10;
  }

  popoverPosition.value = {
    top,
    left,
    placement,
    triggerRect: {
      top: buttonRect.top,
      bottom: buttonRect.bottom,
      height: buttonRect.height,
      width: buttonRect.width,
    },
  };
};

const closePopover = () => {
  showPopover.value = false;
};

const updateTooltipPosition = async () => {
  if (!buttonRef.value || !showTooltip.value) return;

  await nextTick();
  if (!tooltipRef.value) return;

  const buttonRect = buttonRef.value.getBoundingClientRect();
  const tooltipRect = tooltipRef.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate horizontal position (center tooltip under button)
  let left = buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2;

  // Check if tooltip would go off the right edge
  if (left + tooltipRect.width > viewportWidth - 10) {
    left = viewportWidth - tooltipRect.width - 10;
  }

  // Check if tooltip would go off the left edge
  if (left < 10) {
    left = 10;
  }

  // Calculate vertical position
  let top = buttonRect.bottom + 8; // 8px spacing below button
  let placement: 'below' | 'above' = 'below';

  // Check if tooltip would go off the bottom edge
  if (top + tooltipRect.height > viewportHeight - 10) {
    top = buttonRect.top - tooltipRect.height - 8; // Position above button
    placement = 'above';
  }

  tooltipPosition.value = { top, left, placement };
};

const handleMouseEnter = () => {
  showTooltip.value = true;
  nextTick(() => updateTooltipPosition());
};

const handleMouseLeave = () => {
  showTooltip.value = false;
};

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'h-4 w-4';
    case 'large':
      return 'h-6 w-6';
    default:
      return 'h-5 w-5';
  }
});

const buttonLabel = computed(() => {
  const itemName = props.displayName || props.entityType;

  if (props.allowAddToList) {
    return props.isFavorited
      ? `Manage ${itemName} favorites and collections`
      : `Add ${itemName} to favorites`;
  }

  return props.isFavorited
    ? `Remove ${itemName} from favorites`
    : `Add ${itemName} to favorites`;
});

const tooltipText = computed(() => {
  if (props.allowAddToList) {
    return props.isFavorited ? 'Add to collections' : 'Add to favorites';
  }
  return props.isFavorited ? 'Remove from favorites' : 'Add to favorites';
});

const tooltipClasses = computed(() => {
  return 'fixed px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg pointer-events-none transition-opacity duration-200 whitespace-nowrap dark:bg-gray-700';
});

watch(
  () => props.isFavorited,
  (newValue) => {
    if (!newValue) {
      showPopover.value = false;
    }
  }
);
</script>

<template>
  <RequireAuth :full-width="false">
    <template #has-auth>
      <div class="align-center relative flex justify-end">
        <button
          ref="buttonRef"
          type="button"
          :aria-label="buttonLabel"
          :disabled="isLoading"
          class="add-to-favorites-button rounded-full p-1 transition-all duration-200"
          :class="{
            'text-gray-400 hover:bg-gray-100 hover:text-orange-500 dark:hover:bg-gray-800 dark:hover:text-orange-400':
              !isFavorited,
            'text-green-500 hover:text-green-600': isFavorited,
            'animate-pulse-once': isAnimating,
            'cursor-not-allowed opacity-50': isLoading,
          }"
          @click="handleClick"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
        >
          <svg
            v-if="!isFavorited"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            :class="sizeClasses"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            :class="sizeClasses"
          >
            <!-- White background circle -->
            <circle cx="12" cy="12" r="9.75" fill="white" />
            <!-- Green circle with checkmark -->
            <path
              fill="currentColor"
              fill-rule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
              clip-rule="evenodd"
            />
          </svg>
        </button>

        <!-- Tooltip -->
        <Teleport to="body">
          <div
            v-if="showTooltip && !showPopover"
            ref="tooltipRef"
            :class="tooltipClasses"
            :style="{
              opacity: showTooltip ? 1 : 0,
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              zIndex: 9999,
            }"
          >
            {{ tooltipText }}
          </div>
        </Teleport>

        <!-- Add to List Popover -->
        <AddToListPopover
          v-if="allowAddToList"
          :item-id="itemId"
          :item-type="entityType"
          :is-visible="showPopover"
          :position="popoverPosition"
          :is-already-favorite="isFavorited"
          @close="closePopover"
        />
      </div>
    </template>
    <template #does-not-have-auth>
      <div class="relative inline-block">
        <button
          ref="buttonRef"
          type="button"
          :aria-label="`Add ${displayName || entityType} to favorites`"
          class="add-to-favorites-button cursor-pointer rounded-full p-1 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-orange-500 dark:hover:bg-gray-800 dark:hover:text-orange-400"
          @click="handleClick"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            :class="sizeClasses"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </button>

        <!-- Tooltip for unauthenticated users -->
        <Teleport to="body">
          <div
            v-if="showTooltip && !showPopover"
            ref="tooltipRef"
            :class="tooltipClasses"
            :style="{
              opacity: showTooltip ? 1 : 0,
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              zIndex: 9999,
            }"
          >
            {{ allowAddToList ? 'Add to List' : 'Add to favorites' }}
          </div>
        </Teleport>

        <!-- Add to List Popover for unauthenticated users -->
        <AddToListPopover
          v-if="allowAddToList"
          :item-id="itemId"
          :item-type="entityType"
          :is-visible="showPopover"
          :position="popoverPosition"
          :is-already-favorite="isFavorited"
          @close="closePopover"
        />
      </div>
    </template>
  </RequireAuth>
</template>

<style scoped>
@keyframes pulse-once {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.animate-pulse-once {
  animation: pulse-once 0.3s ease-in-out;
}
</style>
