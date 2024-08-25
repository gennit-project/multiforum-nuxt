<script lang="ts">
import { SelectOptionData } from "@/types/GenericFormTypes";
import { defineComponent, PropType, nextTick, ref, onMounted } from "vue";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import LinkIcon from "@/components/icons/LinkIcon.vue";
import FlagIcon from "@/components/icons/FlagIcon.vue";
import HandThumbDownIcon from "@/components/icons/HandThumbDownIcon.vue";
import EyeIcon from "@/components/icons/EyeIcon.vue";
import PencilIcon from "@/components/icons/PencilIcon.vue";
import TrashIcon from "@/components/icons/TrashIcon.vue";
import XmarkIcon from "@/components/icons/XmarkIcon.vue";

export const ALLOWED_ICONS = {
  COPY_LINK: "COPY_LINK",
  REPORT: "REPORT",
  GIVE_FEEDBACK: "GIVE_FEEDBACK",
  VIEW_FEEDBACK: "VIEW_FEEDBACK",
  EDIT: "EDIT",
  DELETE: "DELETE",
  CANCEL: "CANCEL",
  UNDO: "UNDO",
};

const actionIconMap = {
  [ALLOWED_ICONS.COPY_LINK]: LinkIcon,
  [ALLOWED_ICONS.REPORT]: FlagIcon,
  [ALLOWED_ICONS.GIVE_FEEDBACK]: HandThumbDownIcon,
  [ALLOWED_ICONS.VIEW_FEEDBACK]: EyeIcon,
  [ALLOWED_ICONS.EDIT]: PencilIcon,
  [ALLOWED_ICONS.DELETE]: TrashIcon,
  [ALLOWED_ICONS.CANCEL]: XmarkIcon,
  [ALLOWED_ICONS.UNDO]: XmarkIcon,
};

export default defineComponent({
  components: {
    ChevronDownIcon,
    MenuComponent: Menu,
    MenuButton,
    MenuItem,
    MenuItems,
    PencilIcon,
    LinkIcon,
    FlagIcon,
    HandThumbDownIcon,
    EyeIcon,
    TrashIcon,
    XmarkIcon,
  },
  props: {
    items: {
      type: Array as PropType<SelectOptionData[]>,
      default: () => {
        return [];
      },
    },
  },
  setup() {
    // Give the button a unique ID so this will work even if there are multiple menu buttons.
    const uniqueID = ref(Math.random().toString(36).substring(7));
    const shouldOpenUpwards = ref(false);
    const shouldOpenLeftwards = ref(false);

    const adjustMenuPosition = () => {
      nextTick(() => {
        const menuButton = document.querySelector(
          `#menu-button-${uniqueID.value}`,
        );
        const menuItems = document.querySelector(
          `#menu-items-${uniqueID.value}`,
        );

        if (menuButton && menuItems) {
          const menuButtonRect = menuButton.getBoundingClientRect();
          const menuItemsHeight = menuItems.getBoundingClientRect().height;
          const menuItemsWidth = menuItems.getBoundingClientRect().width;
          const spaceBelow = window.innerHeight - menuButtonRect.bottom;
          shouldOpenUpwards.value = spaceBelow < menuItemsHeight;

          // Calculate the number of pixels from the menu button to the left
          // edge of the screen.
          const spaceLeft = menuButtonRect.left;
          // Open to the left if there is enough space to the left of the menu button.
          shouldOpenLeftwards.value = spaceLeft > menuItemsWidth;
        }
      });
    };

    onMounted(adjustMenuPosition);
    window.addEventListener("resize", adjustMenuPosition);

    return {
      actionItemMap: actionIconMap,
      adjustMenuPosition,
      shouldOpenLeftwards,
      shouldOpenUpwards,
      uniqueID,
    };
  },
});
</script>

<template>
  <MenuComponent
    as="div"
    class="relative inline-block text-left"
  >
    <MenuButton
      :id="`menu-button-${uniqueID}`"
      class="menu-button focus:ring-indigo-500 inline-flex w-full justify-center rounded-md px-1 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100"
      @click="adjustMenuPosition"
    >
      <slot>
        Options
        <ChevronDownIcon
          class="-mr-1 ml-2 h-5 w-5"
          aria-hidden="true"
        />
      </slot>
    </MenuButton>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <MenuItems
        :id="`menu-items-${uniqueID}`"
        class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700 dark:text-gray-200"
        :style="{
          top: shouldOpenUpwards ? 'auto' : '100%',
          right: shouldOpenLeftwards ? 0 : 'auto',
          bottom: shouldOpenUpwards ? '100%' : 'auto',
          zIndex: 10000,
        }"
      >
        <div class="py-1">
          <MenuItem
            v-for="item in items"
            v-slot="{ active }"
            :key="item.label"
          >
            <router-link
              v-if="item.value"
              :to="item.value"
              class="flex items-center"
              :class="[
                active
                  ? 'bg-white  text-gray-900 dark:bg-gray-500 dark:text-gray-100'
                  : 'text-gray-700 dark:text-white',
                'block px-4 py-2 text-sm',
              ]"
            >
              <component
                :is="actionItemMap[item.icon]"
                class="mr-2 h-6 w-6"
              />
              {{ item.label }}
            </router-link>
            <div
              v-else-if="item.event"
              class="flex items-center"
              :class="[
                active
                  ? 'bg-white text-gray-900 hover:bg-gray-200 dark:bg-gray-500 dark:text-gray-100'
                  : 'text-gray-700 dark:text-white',
                'block cursor-pointer px-4 py-2 text-sm',
              ]"
              @click="$emit(item.event)"
            >
              <component
                :is="actionItemMap[item.icon]"
                class="mr-2 h-4 w-4"
              />
              {{ item.label }}
            </div>
          </MenuItem>
        </div>
      </MenuItems>
    </transition>
  </MenuComponent>
</template>
