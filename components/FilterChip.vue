<script>
  import { defineComponent, ref, computed, onMounted, onUnmounted } from "vue";
  import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
  import { useUIStore } from "@/stores/uiStore";

  export default defineComponent({
    components: {
      ChevronDownIcon,
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

      const handleClickOutside = (event) => {
        if (isOpen.value && !event.target.closest('.relative')) {
          isOpen.value = false;
        }
      };

      onMounted(() => {
        document.addEventListener('click', handleClickOutside);
      });

      onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside);
      });

      return {
        theme,
        isOpen,
        handleClick,
      };
    },
  });
</script>

<template>
  <div class="align-items flex relative">
    <button
      class="font-small align-items flex whitespace-nowrap rounded-md border bg-white px-3 py-2 text-xs text-gray-700 hover:bg-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-600"
      :class="[highlighted ? 'border-orange-500 ring-1 ring-orange-500' : '']"
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
    <div
      v-if="isOpen"
      class="absolute top-full left-0 z-50 mt-1 rounded-md border bg-white shadow-lg dark:bg-gray-700"
      @click.stop
    >
      <slot name="content" />
    </div>
  </div>
</template>
