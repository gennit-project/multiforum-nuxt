<script setup lang="ts">
import { ref, computed , defineEmits, defineProps } from 'vue';
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
    default: "",
  },
  icon: {
    type: String,
    default: "",
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

<<<<<<< HEAD
  function getButtonStyles() {
    if (props.active) {
      return "bg-orange-500 text-white hover:bg-orange-600";
    } else {
      if (props.channelMode) {
        return "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-50 dark:hover:bg-gray-600 dark:hover:text-white";
      }
      return "bg-gray-100 text-gray-600 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 pl-2 dark:hover:bg-gray-400 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-200";
=======
function getButtonStyles() {
  if (props.active) {
    return 'bg-blue-500 text-white hover:bg-blue-600';
  } else {
    if (props.channelMode) {
      return 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-50 dark:hover:bg-gray-600 dark:hover:text-white';
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    }
    return 'bg-gray-100 text-gray-600 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 pl-2 dark:hover:bg-gray-400 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-200';
  }
}
</script>

<template>
  <span
    :data-testid="props.dataTestId"
    :class="tagClasses"
    @mouseenter="highlightedByMouse = true"
    @mouseleave="highlightedByMouse = false"
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
    <XmarkIcon
      v-if="props.clearable"
      data-testid="tag-delete"
      class="mr-1 h-3 w-3 cursor-pointer"
      @click="emits('delete', props.index)"
    />
  </span>
</template>

<style scoped>
.tag {
  margin-bottom: 5px;
}
</style>
