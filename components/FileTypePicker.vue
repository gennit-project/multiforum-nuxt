<script lang="ts" setup>
import { ref, watch } from 'vue';
import type { PropType } from 'vue';
import SearchableFileTypeList from '@/components/SearchableFileTypeList.vue';

const props = defineProps({
  selectedFileTypes: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  description: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['setSelectedFileTypes']);

const isDropdownOpen = ref(false);
const selected = ref([...props.selectedFileTypes]);

const toggleDropdown = () => {
  if (!props.disabled) {
    isDropdownOpen.value = !isDropdownOpen.value;
  }
};

const toggleSelectedFileType = (fileType: string) => {
  const index = selected.value.indexOf(fileType);
  if (index === -1) {
    selected.value.push(fileType);
  } else {
    selected.value.splice(index, 1);
  }
  emit('setSelectedFileTypes', selected.value);
};

watch(
  () => props.selectedFileTypes,
  (newVal) => {
    selected.value = [...newVal];
  }
);

const outside = () => {
  isDropdownOpen.value = false;
};

const removeSelection = (fileType: string) => {
  selected.value = selected.value.filter((c) => c !== fileType);
  emit('setSelectedFileTypes', selected.value);
};
</script>

<template>
  <div>
    <div v-if="description" class="py-1 text-sm dark:text-gray-300">
      {{ description }}
    </div>
    <div class="relative">
      <div
        class="flex min-h-10 w-full cursor-text flex-wrap items-center rounded-lg border px-4 text-left text-sm dark:border-gray-700 dark:bg-gray-700"
        :class="{
          'cursor-not-allowed opacity-50': disabled,
          'cursor-text': !disabled,
        }"
        @click="toggleDropdown"
      >
        <div
          v-if="selected.length === 0"
          class="text-gray-500 dark:text-gray-400"
        >
          <span v-if="disabled"> Enable downloads to select file types </span>
          <span v-else> Select allowed file types... </span>
        </div>
        <div
          v-for="(fileType, index) in selected"
          :key="index"
          class="mr-2 mt-1 inline-flex items-center rounded-full bg-orange-100 px-2 text-orange-700 dark:bg-orange-700 dark:text-orange-100"
          :class="{ 'opacity-50': disabled }"
          @click="!disabled && removeSelection(fileType)"
        >
          <span>{{ fileType }}</span>
          <span
            v-if="!disabled"
            class="ml-1 cursor-pointer"
            @click.stop="removeSelection(fileType)"
          >
            &times;
          </span>
        </div>
        <input
          v-if="!disabled"
          data-testid="file-type-picker"
          class="bg-transparent flex-1 border-none text-sm focus:outline-none dark:text-white"
          placeholder="Search file types..."
          readonly
        />
      </div>
      <SearchableFileTypeList
        v-if="isDropdownOpen && !disabled"
        v-click-outside="outside"
        :selected-file-types="selected"
        @toggle-selection="toggleSelectedFileType"
      />
    </div>
  </div>
</template>
