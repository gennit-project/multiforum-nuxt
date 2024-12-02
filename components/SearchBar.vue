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
    default: "search-bar",
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

const updateSearchInput = (e: any) => {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    emit("updateSearchInput", removeQuotationMarks(e.target.value));
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
        v-model="input"
        name="search"
        :data-testid="testId"
        :class="[
          leftSideIsRounded ? 'rounded-l-full' : '',
          rightSideIsRounded ? 'rounded-r-full' : '',
          small ? 'h-10' : 'h-12',
        ]"
        class="w-full border border-gray-200 pl-10 pr-3 text-sm leading-5 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        :placeholder="searchPlaceholder"
        type="text"
        @input="updateSearchInput"
      >
      <slot>
        <div
          class="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3"
          @click="clear"
        >
          <i
            class="fa-solid fa-xmark h-4 w-4 text-gray-400 dark:text-gray-300"
          />
        </div>
      </slot>
      <label for="search" class="sr-only">Search</label>
    </div>
  </div>
</template>
