<script lang="ts">
import { defineComponent, nextTick, ref } from "vue";
import SearchIcon from "@/components/icons/SearchIcon.vue";

interface Ref<T> {
  value: T;
}

export default defineComponent({
  components: {
    SearchIcon,
  },
  props: {
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
  },
  setup(props) {
    const input: Ref<string> = ref(props.initialValue);
    return { input, searchInputRef: ref(null) };
  },
  created() {
    nextTick(() => {
      if (this.autoFocus && this.searchInputRef) {
        (this.searchInputRef as any).focus();
      }
    });
  },
  methods: {
    removeQuotationMarks(input: string) {
      // Prevent errors when quotation marks are added
      // to GraphQL query
      return input.split("'").join("").split('"').join("");
    },
    updateSearchInput(e: any) {
      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.$emit(
          "updateSearchInput",
          this.removeQuotationMarks(e.target.value),
        );
      }, 500);
    },
    clear() {
      this.$emit("updateSearchInput", "");
      this.input = "";
    },
  },
});
</script>
<template>
  <div>
    <label
      for="search"
      class="sr-only"
    >Search</label>
    <div class="relative flex-1 items-center">
      <div
        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
      >
        <SearchIcon />
      </div>
      <input
        ref="searchInputRef"
        v-model="input"
        name="search"
        data-testid="search-bar"
        :class="[
          leftSideIsRounded ? 'rounded-l-full' : '',
          rightSideIsRounded ? 'rounded-r-full' : '',
          small ? 'h-10' : 'h-12',
        ]"
        class="w-full flex-1 border border-gray-200 pl-10 pr-3 text-sm leading-5 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        :placeholder="searchPlaceholder"
        type="text"
        @keyup="updateSearchInput"
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
    </div>
  </div>
</template>
