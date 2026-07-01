<script lang="ts" setup>
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import type { PropType } from 'vue';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue';
import SortIcon from '@/components/icons/SortIcon.vue';

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
    default: '',
  },
  showSortIcon: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const emit = defineEmits(['clickedItem']);

function handleClick(item: MenuItemType) {
  emit('clickedItem', item.value);
}
</script>

<template>
  <client-only>
    <Menu as="div" class="relative inline-block text-left">
      <div>
        <MenuButton
          :data-testid="`text-dropdown-${label}`"
          class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gradient-to-b from-white to-gray-50 px-3.5 text-sm font-medium text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-colors duration-200 hover:border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:border-slate-600 dark:bg-none dark:bg-slate-900 dark:text-gray-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:focus:ring-slate-500"
        >
          <SortIcon v-if="showSortIcon" class="h-4 w-4" aria-hidden="true" />
          {{ label }}
          <ChevronDownIcon
            class="h-3.5 w-3.5 shrink-0"
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
          class="top absolute right-0 mt-2 w-56 origin-top-right rounded-lg border border-gray-200 bg-white/95 shadow-lg shadow-black/10 ring-1 ring-black/5 backdrop-blur-sm focus:outline-none dark:border-slate-600 dark:bg-slate-900/95 dark:text-gray-200 dark:ring-white/10"
        >
          <div class="py-1">
            <MenuItem
              v-for="(item, i) in items"
              :key="i"
              v-slot="{ active }"
              class="cursor-pointer"
              @click="handleClick(item)"
            >
              <span
                :class="[
                  active
                    ? 'bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-gray-100'
                    : 'text-gray-700 dark:text-gray-200',
                  'block rounded-md px-4 py-2 text-sm',
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
          class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gradient-to-b from-white to-gray-50 px-3.5 text-sm font-medium text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-colors duration-200 hover:border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:border-slate-600 dark:bg-none dark:bg-slate-900 dark:text-gray-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:border-slate-500 dark:hover:bg-slate-800 dark:focus:ring-slate-500"
        >
          <SortIcon v-if="showSortIcon" class="h-4 w-4" aria-hidden="true" />
          {{ label }}
          <ChevronDownIcon class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </button>
      </template>
  </client-only>
</template>

<style scoped>
.top {
  z-index: 10000;
}
</style>
