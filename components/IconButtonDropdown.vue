<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import type { PropType } from 'vue';
import { useRouter } from 'nuxt/app';

export type MenuItemType = {
  value: string;
  icon?: string;
  label: string;
  event?: string;
  isDivider?: boolean;
};

const props = defineProps({
  darkBackground: {
    type: Boolean,
    required: false,
    default: false,
  },
  items: {
    type: Array as PropType<MenuItemType[]>,
    required: true,
  },
  menuButtonIcon: {
    type: String,
    required: false,
    default: '',
  },
  ariaLabel: {
    type: String,
    required: false,
    default: 'Menu',
  },
});

// Allow emitting dynamic string events with typed arguments
const emit = defineEmits<(event: string, ...args: unknown[]) => void>();
const router = useRouter();

const handleItemClick = (item: MenuItemType) => {
  if (item.event) {
    emit(item.event, item.value);
  } else {
    router.push(item.value);
  }
};
</script>

<template>
  <client-only>
    <Menu as="div" class="relative flex items-center text-left">
      <MenuButton
        :class="[
          'font-semibold inline-flex h-10 w-full items-center justify-center gap-x-1.5 rounded-full px-2 text-sm text-black focus:outline-none dark:text-gray-300 dark:hover:text-white',
          darkBackground ? 'text-gray-200 hover:text-white' : '',
        ]"
        :aria-label="props.ariaLabel"
      >
        <i v-if="menuButtonIcon" :class="` ${menuButtonIcon} `" aria-hidden="true" />
        <div v-else class="flex items-center">
          <slot />
        </div>
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
          class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700 dark:text-gray-200"
          style="top: calc(100% + 8px)"
        >
          <div class="py-1">
            <template v-for="(item, i) in items" :key="i">
              <!-- Divider -->
              <div
                v-if="item.isDivider"
                class="font-semibold px-4 py-2 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                {{ item.value }}
              </div>
              <!-- Regular menu item -->
              <MenuItem
                v-else
                v-slot="{ active }"
                class="cursor-pointer"
                @click="handleItemClick(item)"
              >
                <span
                  :class="[
                    active
                      ? 'bg-gray-100 text-gray-900 dark:hover:bg-gray-500 dark:hover:text-gray-100'
                      : 'text-gray-700 dark:text-gray-200',
                    'block px-4 py-2 text-sm',
                  ]"
                >
                  <i v-if="item.icon" :class="item.icon" /> {{ item.label }}
                </span>
              </MenuItem>
            </template>
          </div>
        </MenuItems>
      </transition>
    </Menu>
    <template #fallback>
      <button
        class="font-semibold inline-flex h-10 w-full items-center justify-center gap-x-1.5 rounded-full px-2 text-sm text-black focus:outline-none dark:text-white"
        :aria-label="props.ariaLabel"
      >
        <i v-if="menuButtonIcon" :class="` ${menuButtonIcon} `" aria-hidden="true" />
        <div v-else class="flex items-center">
          <slot />
        </div>
      </button>
    </template>
  </client-only>
</template>
