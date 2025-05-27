<script lang="ts" setup>
<<<<<<< HEAD
  import type { PropType } from "vue";
  import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
  import FloatingDropdown from "@/components/FloatingDropdown.vue";
  import { actionIconMap } from "@/utils";
=======
import { ref, nextTick, onMounted } from "vue";
import type { PropType } from "vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import { actionIconMap } from "@/utils";
>>>>>>> parent of 666ae3d (Use automated formatting tools)

import type { MenuItemType } from "./IconButtonDropdown.vue";

defineProps({
  dataTestid: {
    type: String,
    default: "",
  },
  items: {
    type: Array as PropType<MenuItemType[]>,
    default: () => [],
  },
});

<<<<<<< HEAD
  const emits = defineEmits<(e: string) => void>();

  const emitEvent = (eventName: string) => {
    emits(eventName);
  };
</script>

<template>
  <FloatingDropdown placement="bottom-start">
    <template #trigger>
      <button
        class="focus:ring-indigo-500 inline-flex justify-start rounded-md px-1 text-sm shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100"
        :data-testid="dataTestid"
      >
        <slot>
          Options
          <ChevronDownIcon
            aria-hidden="true"
            class="-mr-1 ml-2 h-5 w-5"
          />
        </slot>
      </button>
    </template>

    <template #content="{ close }">
      <div class="py-1">
        <template
          v-for="item in items"
          :key="item.label"
        >
=======
const emits = defineEmits<(e: string) => void>(); // Accept any event type

const emitEvent = (eventName: string) => {
  emits(eventName);
};

// Setup function
const uniqueID = ref(Math.random().toString(36).substring(7));
const shouldOpenUpwards = ref(false);
const shouldOpenLeftwards = ref(false);

const adjustMenuPosition = () => {
  nextTick(() => {
    const menuButton = document.querySelector(`#menu-button-${uniqueID.value}`);
    const menuItems = document.querySelector(`#menu-items-${uniqueID.value}`);

    if (menuButton && menuItems) {
      const menuButtonRect = menuButton.getBoundingClientRect();
      const menuItemsHeight = menuItems.getBoundingClientRect().height;
      const menuItemsWidth = menuItems.getBoundingClientRect().width;
      const spaceBelow = window.innerHeight - menuButtonRect.bottom;
      shouldOpenUpwards.value = spaceBelow < menuItemsHeight;

      const spaceLeft = menuButtonRect.left;
      shouldOpenLeftwards.value = spaceLeft > menuItemsWidth;
    }
  });
};

onMounted(() => {
  adjustMenuPosition();
  window.addEventListener("resize", adjustMenuPosition);
});

const handleItemClick = (item: MenuItemType) => {
  if (item.event) {
    emitEvent(item.event);
  }
};
const isMenuOpen = ref(false);
const menuStyles = {
  top: shouldOpenUpwards.value ? "auto" : "100%",
  right: shouldOpenLeftwards.value ? 0 : "auto",
  bottom: shouldOpenUpwards.value ? "100%" : "auto",
  zIndex: 10000,
};
</script>

<template>
  <client-only>
    <v-menu v-model="isMenuOpen" :close-on-content-click="true" offset-y>
      <template #activator="{ props }">
        <button
          :data-testid="dataTestid"
          variant="text"
          v-bind="props"
          class="shadow-none focus:ring-indigo-500 inline-flex justify-start rounded-md px-1 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100"
          @click="adjustMenuPosition"
        >
          <slot>
            Options
            <ChevronDownIcon class="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
          </slot>
        </button>
      </template>

      <v-list :style="menuStyles" class="dark:bg-gray-700">
        <template v-for="item in items" :key="item.label">
>>>>>>> parent of 666ae3d (Use automated formatting tools)
          <!-- Divider -->
          <div
            v-if="item.isDivider"
            class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-default"
          >
          
            {{ item.value }}
<<<<<<< HEAD
          </div>
          <div v-else>
            <nuxt-link
              v-if="item.value"
              class="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              :to="item.value"
              @click="close"
=======
          </v-list-subheader>
          <v-list-item
            v-else
            :data-testid="`${dataTestid}-item-${item.label}`"
            class="dark:hover:bg-gray-600"
            @click="
              () => {
                handleItemClick(item);
                isMenuOpen = false;
              }
            "
          >
            <nuxt-link
              v-if="item.value"
              :to="item.value"
              class="flex gap-2 items-center text-sm"
              :class="['text-gray-700 dark:text-white']"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
            >
              <component
                :is="actionIconMap[item.icon]" 
                v-if="item.icon" 
                class="h-5 w-5" 
              />
              {{ item.label }}
            </nuxt-link>
            <button
              v-else-if="item.event"
<<<<<<< HEAD
              class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              :data-testid="`${dataTestid}-item-${item.label}`"
              @click="() => { emitEvent(item.event); close(); }"
=======
              :data-testid="`${dataTestid}-item-${item.label}`"
               class="flex gap-2 items-center text-sm cursor-pointer"
              :class="['text-gray-700 dark:text-white']"
              @click="emitEvent(item?.event ?? '')"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
            >
            <component
                :is="actionIconMap[item.icon]" 
                v-if="item.icon" 
                class="h-5 w-5" 
              />
              {{ item.label }}
            </button>
          </div>
        </template>
      </div>
    </template>
  </FloatingDropdown>
</template>