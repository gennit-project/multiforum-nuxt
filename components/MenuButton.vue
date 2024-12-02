<script lang="ts" setup>
import { ref, nextTick, onMounted } from "vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import { actionIconMap } from "@/utils";

import type { MenuItemType } from "./IconButtonDropdown.vue";

// Props
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
  <v-menu v-model="isMenuOpen" :close-on-content-click="true" offset-y>
    <template #activator="{ props }">
      <v-btn
        :data-testid="dataTestid"
        variant="text"
        v-bind="props"
        class="shadow-none focus:ring-indigo-500 inline-flex justify-center rounded-md px-1 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100"
        @click="adjustMenuPosition"
      >
        <slot>
          Options
          <ChevronDownIcon class="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
        </slot>
      </v-btn>
    </template>

    <v-list :style="menuStyles" class="dark:bg-gray-700">
      <v-list-item
        v-for="item in items"
        :key="item.label"
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
        >
          <component :is="actionIconMap[item.icon]" class="h-5 w-5" />
          {{ item.label }}
        </nuxt-link>
        <div
          v-else-if="item.event"
          class="flex items-center block cursor-pointer px-4 py-2 text-sm"
          :class="['text-gray-700 dark:text-white']"
          @click="emitEvent(item?.event ?? '')"
        >
          {{ item.label }}
        </div>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
