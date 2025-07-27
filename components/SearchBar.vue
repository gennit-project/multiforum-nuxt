<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import SearchIcon from "@/components/icons/SearchIcon.vue";

// Props
const props = defineProps({
  autoFocus: {
    type: Boolean,
    default: true,
  },
  initialValue: {
    type: String,
    default: "",
  },
  searchPlaceholder: {
    type: String,
    default: "",
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
    default: "",
  },
});

// Emit event
const emit = defineEmits(["updateSearchInput"]);

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
  return input.split("'").join("").split('"').join("");
};

let timeout: ReturnType<typeof setTimeout> | null = null;

const updateSearchInput = (e: Event) => {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    const target = e.target as HTMLInputElement;
    emit("updateSearchInput", removeQuotationMarks(target.value));
  }, 500);
};

const clear = () => {
  emit("updateSearchInput", "");
  input.value = "";
};
</script>

<template>
  <div class="flex flex-1 items-center justify-center h-full">
    <div class="relative flex items-center w-full">
      <div
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
      >
        <SearchIcon />
      </div>
      <input
        ref="searchInputRef"
        :value="initialValue"
        name="search"
        :data-testid="testId"
        :class="[
          leftSideIsRounded ? 'rounded-l-full' : 'rounded-l-md',
          rightSideIsRounded ? 'rounded-r-full' : 'rounded-r-md',
          small ? 'h-9' : 'h-10',
        ]"
        class="w-full border border-gray-200 pl-10 pr-12 text-sm leading-5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400"
        :placeholder="searchPlaceholder"
        type="text"
        @input="updateSearchInput"
      >
      <div 
        v-if="initialValue" 
        class="absolute right-12 inset-y-0 flex cursor-pointer items-center z-10" 
        @click="clear"
      >
        <i class="fa-solid fa-xmark h-4 w-4 text-gray-400 dark:text-gray-300" />
      </div>
      <slot />
      <label for="search" class="sr-only">Search</label>
    </div>
  </div>
</template>
