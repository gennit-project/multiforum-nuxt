<script lang="ts" setup>
import { ref, nextTick, onMounted, computed } from 'vue';
import type { PropType } from 'vue';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue';
import { actionIconMap } from '@/utils';

import type { MenuItemType } from './IconButtonDropdown.vue';

const props = defineProps({
  dataTestid: {
    type: String,
    default: '',
  },
  buttonClass: {
    type: String,
    default: '',
  },
  ariaLabel: {
    type: String,
    default: '',
  },
  items: {
    type: Array as PropType<MenuItemType[]>,
    default: () => [],
  },
  isMarkedAsAnswer: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emits = defineEmits<(e: string) => void>(); // Accept any event type

const emitEvent = (eventName: string) => {
  emits(eventName);
};

// Computed class for green styling when comment is marked as best answer
const buttonClasses = computed(() => {
  const baseClasses =
    'shadow-none focus:ring-indigo-500 inline-flex justify-start rounded-md px-1 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100';

  if (props.isMarkedAsAnswer) {
    return `${baseClasses} text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300`;
  }

  return baseClasses;
});

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

const buildActivatorProps = (activatorProps: Record<string, unknown>) => {
  if (props.disabled) {
    return {
      disabled: true,
      'aria-disabled': true,
    };
  }

  const onClick = (activatorProps as { onClick?: (event: Event) => void })
    .onClick;

  return {
    ...activatorProps,
    onClick: (event: Event) => {
      if (typeof onClick === 'function') {
        onClick(event);
      }
      adjustMenuPosition();
    },
  };
};

onMounted(() => {
  adjustMenuPosition();
  window.addEventListener('resize', adjustMenuPosition);
});

const handleItemClick = (item: MenuItemType) => {
  if (item.event) {
    emitEvent(item.event);
  }
};
const isMenuOpen = ref(false);
const menuStyles = {
  top: shouldOpenUpwards.value ? 'auto' : '100%',
  right: shouldOpenLeftwards.value ? 0 : 'auto',
  bottom: shouldOpenUpwards.value ? '100%' : 'auto',
  zIndex: 10000,
};
</script>

<template>
  <client-only>
    <v-menu v-model="isMenuOpen" :close-on-content-click="true" offset-y>
      <template #activator="{ props: activatorProps }">
        <slot
          name="activator"
          :props="buildActivatorProps(activatorProps)"
          :disabled="disabled"
        >
          <button
            :data-testid="dataTestid"
            variant="text"
            v-bind="buildActivatorProps(activatorProps)"
            :aria-label="ariaLabel || undefined"
            :disabled="disabled"
            :class="[
              buttonClasses,
              buttonClass,
              disabled ? 'cursor-not-allowed opacity-60' : '',
            ]"
          >
            <slot>
              Options
              <ChevronDownIcon class="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
            </slot>
          </button>
        </slot>
      </template>

      <v-list
        :style="menuStyles"
        class="dark:bg-gray-700"
        role="menu"
        :aria-label="ariaLabel || 'Menu'"
      >
        <template v-for="item in items" :key="item.label">
          <!-- Divider -->
          <v-list-subheader
            v-if="item.isDivider"
            class="font-semibold cursor-default px-4 py-2 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-200"
            role="presentation"
          >
            {{ item.value }}
          </v-list-subheader>
          <v-list-item
            v-else
            :data-testid="`${dataTestid}-item-${item.label}`"
            class="dark:hover:bg-gray-600"
            role="menuitem"
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
              class="flex items-center gap-2 text-sm"
              :class="['text-gray-700 dark:text-white']"
            >
              <component
                :is="actionIconMap[item.icon]"
                v-if="item.icon"
                class="h-5 w-5"
              />
              {{ item.label }}
            </nuxt-link>
            <div
              v-else-if="item.event"
              :data-testid="`${dataTestid}-item-${item.label}`"
              class="flex cursor-pointer items-center gap-2 text-sm"
              :class="['text-gray-700 dark:text-white']"
              @click="emitEvent(item?.event ?? '')"
            >
              <component
                :is="actionIconMap[item.icon]"
                v-if="item.icon"
                class="h-5 w-5"
              />
              {{ item.label }}
            </div>
          </v-list-item>
        </template>
      </v-list>
    </v-menu>
  </client-only>
</template>
