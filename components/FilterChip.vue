<script>
  import { defineComponent, ref, computed } from "vue";
  import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
  import { useUIStore } from "@/stores/uiStore";
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
    emits: ["click"],
    setup(props, { emit }) {
      const isOpen = ref(false);
      const uiStore = useUIStore();
      const theme = computed(() => uiStore.theme);

      const handleClick = () => {
        isOpen.value = !isOpen.value;
        emit("click");
      };

      return {
        theme,
        isOpen,
        handleClick,
      };
    },
  });
</script>

<template>
  <div class="align-items flex">
    <client-only>
      <Popper
        v-model="isOpen"
        :close-on-content-click="false"
        location="bottom"
      >
        <button
          class="font-small align-items focus:border-orange-500 focus:ring-orange-500 flex whitespace-nowrap rounded-md border bg-white px-3 py-2 text-xs text-gray-700 hover:bg-gray-200 focus:ring-1 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-600"
          :class="[highlighted ? 'border-orange-500 ring-orange-500 ring-1' : '']"
          :data-testid="dataTestid"
          @click="handleClick"
        >
          <slot name="icon" />
          {{ label }}
          <ChevronDownIcon
            aria-hidden="true"
            class="-mr-1 ml-1 mt-0.5 h-3 w-3"
          />
        </button>
        <template #content>
          <div class="rounded-md border bg-white dark:bg-gray-700">
            <slot name="content" />
          </div>
        </template>
      </Popper>
      <template #fallback>
        <button
          class="max-height-3 font-small focus:border-orange-500 focus:ring-orange-500 mr-2 inline-flex whitespace-nowrap rounded-md border bg-white px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-200 focus:ring-1 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          :class="[highlighted ? 'border-orange-500 ring-orange-500 ring-1' : '']"
          :data-testid="dataTestid"
        >
          <slot name="icon" />
          {{ label }}
          <ChevronDownIcon
            aria-hidden="true"
            class="-mr-1 ml-1 mt-0.5 h-3 w-3"
          />
        </button>
      </template>
    </client-only>
  </div>
</template>
