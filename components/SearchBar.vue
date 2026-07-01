<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import SearchIcon from '@/components/icons/SearchIcon.vue';

// Props
const props = defineProps({
  autoFocus: {
    type: Boolean,
    default: true,
  },
  initialValue: {
    type: String,
    default: '',
  },
  searchPlaceholder: {
    type: String,
    default: '',
  },
  small: {
    type: Boolean,
    default: false,
  },
  leftSideIsRounded: {
    type: Boolean,
    default: true,
  },
  rightSideIsRounded: {
    type: Boolean,
    default: true,
  },
  testId: {
    type: String,
    default: '',
  },
  debounceMs: {
    type: Number,
    default: 500,
  },
});

// Emit event
const emit = defineEmits(['updateSearchInput', 'submit']);

// Template refs
const searchInputRef = ref<HTMLElement | null>(null);
const input = ref(props.initialValue);

// Lifecycle hooks
onMounted(() => {
  if (props.autoFocus && searchInputRef.value) {
    nextTick(() => {
      if (searchInputRef.value instanceof HTMLElement) {
        searchInputRef.value.focus();
      }
    });
  }
});

const removeQuotationMarks = (input: string) => {
  return input.split("'").join('').split('"').join('');
};

let timeout: ReturnType<typeof setTimeout> | null = null;

const updateSearchInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  input.value = target.value;
  const emitValue = () =>
    emit('updateSearchInput', removeQuotationMarks(target.value));

  if (props.debounceMs <= 0) {
    emitValue();
    return;
  }

  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(emitValue, props.debounceMs);
};

const submit = (e: Event) => {
  const target = e.target as HTMLInputElement;
  input.value = target.value;
  emit('submit', removeQuotationMarks(target.value));
};

const clear = () => {
  emit('updateSearchInput', '');
  input.value = '';
};

const focus = () => {
  if (searchInputRef.value instanceof HTMLElement) {
    searchInputRef.value.focus();
  }
};

const getValue = () => {
  if (searchInputRef.value instanceof HTMLInputElement) {
    return searchInputRef.value.value;
  }
  return '';
};

defineExpose({ focus, getValue });
</script>

<template>
  <div class="flex h-full flex-1 items-center justify-center">
    <div class="relative flex w-full items-center">
      <div
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-300"
        aria-hidden="true"
      >
        <SearchIcon class="h-4 w-4" />
      </div>
      <input
        ref="searchInputRef"
        :value="input"
        name="search"
        :data-testid="testId"
        :class="[
          leftSideIsRounded ? 'rounded-l-lg' : '',
          rightSideIsRounded ? 'rounded-r-lg' : '',
          small ? 'h-10' : 'h-10',
        ]"
        class="search-bar-input w-full border border-gray-200 bg-gradient-to-b from-white to-gray-50 pl-10 pr-12 text-sm leading-5 text-gray-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] placeholder-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:border-slate-600 dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:placeholder-gray-400 dark:focus:border-slate-500 dark:focus:ring-slate-500"
        :placeholder="searchPlaceholder"
        type="text"
        @input="updateSearchInput"
        @keydown.enter.prevent="submit"
      >
      <button
        v-if="input"
        type="button"
        aria-label="Clear search"
        class="absolute inset-y-0 right-12 z-10 flex cursor-pointer items-center border-none bg-transparent text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
        @click="clear"
      >
        <i
          class="fa-solid fa-xmark h-4 w-4"
          aria-hidden="true"
        />
      </button>
      <slot />
      <label for="search" class="sr-only">Search</label>
    </div>
  </div>
</template>

<style>
html.dark .search-bar-input {
  background-color: rgb(15 23 42) !important;
  background-image: none !important;
}
</style>
