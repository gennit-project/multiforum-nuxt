<script>
import { defineComponent, ref, computed } from "vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import gql from "graphql-tag";
import { useQuery } from "@vue/apollo-composable";
import Popper from "vue3-popper";

export default defineComponent({
  components: {
    ChevronDownIcon,
    Popper,
  },
  props: {
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
    const GET_THEME = gql`
      query getTheme {
        theme @client
      }
    `;

    const {
      result: themeResult,
      loading: themeLoading,
      error: themeError,
    } = useQuery(GET_THEME);

    const theme = computed(() => {
      if (themeLoading.value || themeError.value) {
        return "";
      }
      return themeResult.value.theme;
    });

    return {
      showMenu: ref(false),
      theme,
    };
  },
});
</script>

<template>
  <div class="inline-flex">
    <Popper
      :close-on-content-click="false"
      location="bottom"
    >
      <button
        id="filter-button"
        :class="[highlighted ? 'border-blue-500 ring-1 ring-blue-500' : '']"
        class="max-height-3 font-small mr-2 inline-flex whitespace-nowrap rounded-lg bg-white px-2 px-3 py-2.5 text-xs text-gray-700 border hover:bg-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
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
          class="rounded-lg border bg-white dark:bg-gray-700"
        >
          <slot name="content" />
        </div>
      </template>
    </Popper>
  </div>
</template>
