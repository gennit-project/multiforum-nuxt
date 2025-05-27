<script>
<<<<<<< HEAD
  import { defineComponent, ref, computed, onMounted, onUnmounted, nextTick } from "vue";
  import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
  import { useUIStore } from "@/stores/uiStore";

  export default defineComponent({
    components: {
      ChevronDownIcon,
=======
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
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    },
    label: {
      type: String,
      default: "No label",
    },
<<<<<<< HEAD
    emits: ["click"],
    setup(props, { emit }) {
      const isOpen = ref(false);
      const uiStore = useUIStore();
      const theme = computed(() => uiStore.theme);
      const dropdownRef = ref(null);
      const buttonRef = ref(null);
      const openToRight = ref(false);

      const calculatePosition = async () => {
        await nextTick();
        if (!buttonRef.value) return;

        const buttonRect = buttonRef.value.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const dropdownWidth = 384; // w-96 = 384px

        // If there's not enough space on the right, open to the left
        const spaceOnRight = viewportWidth - buttonRect.right;
        const spaceOnLeft = buttonRect.left;

        if (spaceOnRight < dropdownWidth && spaceOnLeft > dropdownWidth) {
          openToRight.value = false; // Open to left
        } else {
          openToRight.value = true; // Open to right (default)
        }
      };

      const handleClick = async () => {
        isOpen.value = !isOpen.value;
        if (isOpen.value) {
          await calculatePosition();
        }
        emit("click");
      };

      const handleClickOutside = (event) => {
        if (
          isOpen.value &&
          dropdownRef.value &&
          !dropdownRef.value.contains(event.target) &&
          buttonRef.value &&
          !buttonRef.value.contains(event.target)
        ) {
          isOpen.value = false;
        }
      };

      onMounted(() => {
        document.addEventListener("click", handleClickOutside);
      });

      onUnmounted(() => {
        document.removeEventListener("click", handleClickOutside);
      });

      return {
        theme,
        isOpen,
        handleClick,
        dropdownRef,
        buttonRef,
        openToRight,
      };
    },
  });
</script>

<template>
  <div class="align-items relative flex">
    <button
      ref="buttonRef"
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
      ref="dropdownRef"
      class="absolute top-full z-50 mt-1 rounded-md border bg-white shadow-lg dark:bg-gray-700"
      :class="[openToRight ? 'left-0' : 'right-0']"
      @click.stop
    >
      <slot name="content" />
    </div>
=======
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
      emit('click');
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
          class="font-small flex align-items whitespace-nowrap rounded-md bg-white px-3 py-2 text-xs text-gray-700 border hover:bg-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-600"
          @click="handleClick"
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
>>>>>>> parent of 666ae3d (Use automated formatting tools)
  </div>
</template>
