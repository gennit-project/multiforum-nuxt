<script>
import { defineComponent, ref } from "vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import { useTheme } from "@/composables/useTheme";
import Popper from "vue3-popper";

export default defineComponent({
  components: {
    ChevronDownIcon,
    Popper,
  },
  props: {
    dataTestid: {
      type: String,
      default: "filter-button",
    },
    label: {
      type: String,
      default: "No label",
    },
    highlighted: {
      type: Boolean,
      default: false,
    },
  },
  setup() {

    const isOpen = ref(false);
    const { theme } = useTheme();

    return {
      theme,
      isOpen,
    };
  },
});
</script>

<template>
  <div class="flex align-items">
    <client-only>
      <Popper
        v-model="isOpen"
        :close-on-content-click="false"
        location="bottom"
      >
        <button
          :data-testid="dataTestid"
          :class="[highlighted ? 'border-blue-500 ring-1 ring-blue-500' : '']"
          class="max-height-3 font-small mr-2 inline-flex whitespace-nowrap rounded-md bg-white px-3 py-2.5 text-xs text-gray-700 border hover:bg-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          @click="isOpen = !isOpen"
        >
          <slot name="icon" />
          {{ label }}
          <ChevronDownIcon
            class="-mr-1 ml-1 mt-0.5 h-3 w-3"
            aria-hidden="true"
          />
        </button>
        <template #content>
          <div
            class="rounded-md border bg-white dark:bg-gray-700"
          >
            <slot name="content" />
          </div>
        </template>
      </Popper>
      <template #fallback>
        <button
          :data-testid="dataTestid"
          :class="[highlighted ? 'border-blue-500 ring-1 ring-blue-500' : '']"
          class="max-height-3 font-small mr-2 inline-flex whitespace-nowrap rounded-md bg-white px-3 py-2.5 text-xs text-gray-700 border hover:bg-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <slot name="icon" />
          {{ label }}
          <ChevronDownIcon
            class="-mr-1 ml-1 mt-0.5 h-3 w-3"
            aria-hidden="true"
          />
        </button>
      </template>
    </client-only>
  </div>
</template>
