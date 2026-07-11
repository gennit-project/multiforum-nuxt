<script lang="ts" setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/vue';
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

const isOpen = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const floatingRef = ref<HTMLElement | null>(null);

const { floatingStyles } = useFloating(triggerRef, floatingRef, {
  placement: 'bottom-end',
  strategy: 'fixed',
  middleware: [offset(4), flip(), shift({ padding: 8 })],
  whileElementsMounted: autoUpdate,
});

function close() {
  isOpen.value = false;
}
function toggle() {
  isOpen.value = !isOpen.value;
}

// Props applied to the trigger. Passed to the `activator` slot so custom
// activators (e.g. VoteButton) can bind them to their own element, exactly as
// the previous v-menu activator did.
const activatorProps = computed(() => {
  if (props.disabled) {
    return {
      disabled: true,
      'aria-disabled': true,
      'aria-haspopup': 'menu' as const,
      'aria-expanded': false,
    };
  }
  return {
    onClick: toggle,
    'aria-haspopup': 'menu' as const,
    'aria-expanded': isOpen.value,
  };
});

const handleItemClick = (item: MenuItemType) => {
  if (item.event) {
    emitEvent(item.event);
  }
  close();
};

/**
 * Checks if a menu item's value is a valid route that should render as a nuxt-link.
 * Valid routes are: route objects or strings starting with '/'.
 * Plain IDs or other strings should not be treated as routes.
 */
const isValidRouteValue = (value: unknown): boolean => {
  if (!value) return false;
  if (typeof value === 'object') return true;
  if (typeof value === 'string' && value.startsWith('/')) return true;
  return false;
};

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node;
  if (
    triggerRef.value?.contains(target) ||
    floatingRef.value?.contains(target)
  ) {
    return;
  }
  close();
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close();
}
function onFocusOut(event: FocusEvent) {
  const relatedTarget = event.relatedTarget as Node | null;
  if (
    relatedTarget &&
    (triggerRef.value?.contains(relatedTarget) ||
      floatingRef.value?.contains(relatedTarget))
  ) {
    return;
  }
  close();
}

watch(isOpen, (open) => {
  if (!import.meta.client) return;
  if (open) {
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
    document.addEventListener('keydown', onKeydown);
  } else {
    document.removeEventListener('pointerdown', onDocumentPointerDown, true);
    document.removeEventListener('keydown', onKeydown);
  }
});

onBeforeUnmount(() => {
  if (!import.meta.client) return;
  document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <div ref="triggerRef" class="inline-block" @focusout="onFocusOut">
    <slot name="activator" :props="activatorProps" :disabled="disabled">
      <button
        :data-testid="dataTestid"
        v-bind="activatorProps"
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

    <client-only>
      <Teleport to="body">
        <div
          v-if="isOpen"
          ref="floatingRef"
          :style="floatingStyles"
          class="z-[10000]"
          @focusout="onFocusOut"
        >
          <div
            class="min-w-[10rem] overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-700"
            role="menu"
            :aria-label="ariaLabel || 'Menu'"
          >
            <template v-for="item in items" :key="item.label">
              <!-- Divider / section header -->
              <div
                v-if="item.isDivider"
                class="font-semibold cursor-default px-4 py-2 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-200"
                role="presentation"
              >
                {{ item.value }}
              </div>
              <!-- Route item -->
              <nuxt-link
                v-else-if="isValidRouteValue(item.value)"
                :to="item.value"
                :data-testid="`${dataTestid}-item-${item.label}`"
                role="menuitem"
                class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-600"
                @click="close"
              >
                <component
                  :is="actionIconMap[item.icon]"
                  v-if="item.icon"
                  class="h-5 w-5"
                />
                {{ item.label }}
              </nuxt-link>
              <!-- Event item -->
              <button
                v-else-if="item.event"
                type="button"
                :data-testid="`${dataTestid}-item-${item.label}`"
                role="menuitem"
                class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-600"
                @click="handleItemClick(item)"
              >
                <component
                  :is="actionIconMap[item.icon]"
                  v-if="item.icon"
                  class="h-5 w-5"
                />
                {{ item.label }}
              </button>
            </template>
          </div>
        </div>
      </Teleport>
    </client-only>
  </div>
</template>
