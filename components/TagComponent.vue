<script setup lang="ts">
import { ref, computed } from 'vue';
import XmarkIcon from '@/components/icons/XmarkIcon.vue';

const props = defineProps({
  active: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  index: {
    type: Number,
    default: 0,
  },
  large: {
    type: Boolean,
    default: false,
  },
  hideIcon: {
    type: Boolean,
    default: false,
  },
  tag: {
    type: String,
    required: true,
  },
  channelMode: {
    type: Boolean,
    default: false,
  },
  titleMode: {
    type: Boolean,
    default: false,
  },
  dataTestId: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
});

const emits = defineEmits(['select', 'deselect', 'delete']);

const highlightedByMouse = ref(false);

const tagClasses = computed(() => {
  return [
    props.large ? 'text-md py-1 shadow rounded-full' : '',
    props.titleMode ? 'text-xl py-1.5' : '',
    !props.large && !props.titleMode ? 'text-xs py-0.5' : '',
    props.clearable ? 'pr-1' : 'cursor-pointer pr-2',
    getButtonStyles(),
    'pl-1 font-medium tag rounded flex items-center gap-1',
  ];
});

function handleTagClick(tag: string, active: boolean) {
  if (active) {
    emits('deselect', tag);
  } else {
    emits('select', tag);
  }
}

function getButtonStyles() {
  if (props.active) {
    return 'bg-brand-400 dark:bg-brand-950 text-black dark:text-brand-400 hover:bg-brand-500 dark:hover:bg-brand-900 dark:hover:text-brand-300';
  } else {
    if (props.channelMode) {
      return 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-50 dark:hover:bg-gray-600 dark:hover:text-white';
    }
    return 'bg-gray-100 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:hover:text-white pl-2';
  }
}
</script>

<template>
  <span
    :data-testid="props.dataTestId"
    :class="tagClasses"
    @mouseenter="highlightedByMouse = true"
    @mouseleave="highlightedByMouse = false"
  >
    <!-- Real button so the tag is keyboard-operable; the click still bubbles to
         the root span, so consumers listening via @click keep working. -->
    <button
      type="button"
      :aria-pressed="props.active"
      class="focus-visible:ring-brand-500 inline-flex items-center gap-1 p-0 text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
      @click="handleTagClick(props.tag, props.active)"
    >
      <AvatarComponent
        v-if="props.channelMode && !props.hideIcon"
        :class="[props.clearable ? 'mr-1' : '', 'h-6 w-6']"
        class="inline-flex"
        :text="props.tag"
        :src="props.icon"
        :is-square="true"
      />
      {{ props.tag }}
    </button>
    <button
      v-if="props.clearable"
      type="button"
      data-testid="tag-delete"
      :aria-label="`Remove ${props.tag}`"
      class="focus-visible:ring-brand-500 inline-flex items-center p-0 focus:outline-none focus-visible:ring-2"
      @click.stop="emits('delete', props.index)"
    >
      <XmarkIcon class="mr-1 h-4 w-4" aria-hidden="true" />
    </button>
  </span>
</template>

<style scoped>
.tag {
  margin-bottom: 5px;
}
</style>
