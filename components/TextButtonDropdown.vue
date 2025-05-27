<script lang="ts" setup>
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import type { PropType } from "vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import SortIcon from "@/components/icons/SortIcon.vue";

type MenuItemType = {
  value: string;
  label: string;
};

defineProps({
  items: {
    type: Array as PropType<MenuItemType[]>,
    required: true,
  },
  label: {
    type: String,
    required: false,
    default: "",
  },
  showSortIcon: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const emit = defineEmits(["clickedItem"]);

function handleClick(item: MenuItemType) {
  emit("clickedItem", item.value);
}
</script>

<template>
  <client-only>
    <Menu as="div" class="relative inline-block text-left">
      <div>
        <MenuButton
<<<<<<< HEAD
          class="inline-flex w-full items-center justify-center gap-x-1.5 rounded-md border border-gray-300 bg-white py-2 pl-3 pr-4 text-xs text-black hover:bg-gray-200 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white hover:dark:bg-gray-700"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
          :data-testid="`text-dropdown-${label}`"
          class="inline-flex border border-gray-800 dark:border-gray-600 hover:dark:bg-gray-700 py-2 w-full items-center justify-center gap-x-1.5 rounded-md bg-white pr-4 pl-3 text-xs text-black hover:bg-gray-200 focus:outline-none dark:bg-gray-900 dark:text-white"
        >
          <SortIcon v-if="showSortIcon" class="h-4 w-4" aria-hidden="true" />
          {{ label }}
          <ChevronDownIcon
            class="-mr-1 ml-1 mt-0.5 h-3 w-3"
            aria-hidden="true"
          />
        </MenuButton>
      </div>
      <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <MenuItems
          class="absolute right-0 top mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700 dark:text-gray-200"
        >
          <div class="py-1">
            <MenuItem
              v-for="(item, i) in items"
              :key="i"
              v-slot="{ active }"
              class="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              @click="handleClick(item)"
            >
              <span
                :class="[
                  active
                    ? 'bg-white text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-500 dark:hover:text-gray-100'
                    : 'text-gray-700 dark:text-gray-200',
                  'block px-4 py-2 text-sm',
                ]"
              >
                {{ item.label }}
              </span>
            </MenuItem>
          </div>
        </MenuItems>
      </transition>
    </Menu>

    <template #fallback>
      <button
        :data-testid="`text-dropdown-${label}`"
        class="inline-flex border dark:border-gray-600 hover:dark:bg-gray-600 h-10 w-full items-center justify-center gap-x-1.5 rounded-md bg-white pr-4 pl-3 text-xs text-black hover:bg-gray-200 focus:outline-none dark:bg-gray-700 dark:text-white"
      >
        <SortIcon v-if="showSortIcon" class="h-4 w-4" aria-hidden="true" />
        {{ label }}
        <ChevronDownIcon class="-mr-1 ml-1 mt-0.5 h-3 w-3" aria-hidden="true" />
      </button>
    </template>
  </client-only>
</template>

<style scoped>
.top {
  z-index: 10000;
}
</style>
