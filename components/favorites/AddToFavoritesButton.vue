<script setup lang="ts">
import { ref, computed } from 'vue';

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
});

const emit = defineEmits<{
  toggle: [];
}>();

const isAnimating = ref(false);

const handleClick = () => {
  if (!props.isLoading) {
    emit('toggle');

    // Start animation if toggling to favorited
    if (!props.isFavorited) {
      isAnimating.value = true;
      setTimeout(() => {
        isAnimating.value = false;
      }, 300);
    }
  }
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
  return props.isFavorited
    ? `Remove ${itemName} from favorites`
    : `Add ${itemName} to favorites`;
});
</script>

<template>
  <button
    type="button"
    :aria-label="buttonLabel"
    :disabled="isLoading"
    class="add-to-favorites-button rounded-full p-1 transition-all duration-200"
    :class="{
      'text-gray-400 hover:bg-gray-100 hover:text-orange-500 dark:hover:bg-gray-800 dark:hover:text-orange-400':
        !isFavorited,
      'text-green-500 hover:text-green-600': isFavorited,
      'animate-pulse-once': isAnimating,
      'opacity-50 cursor-not-allowed': isLoading,
    }"
    @click="handleClick"
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