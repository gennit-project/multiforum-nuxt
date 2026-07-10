<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue';
import { useRoute, useRouter } from 'nuxt/app';

// Props
const createButtonProps = defineProps({
  usePrimaryButton: {
    type: Boolean,
    default: false,
  },
  backgroundColor: {
    type: String,
    default: 'light',
    validator: (value: string) => ['light', 'dark'].includes(value),
  },
  iconOnly: {
    type: Boolean,
    default: false,
  },
});

// Setup logic
const route = useRoute();
const router = useRouter();

const channelId = computed(() => {
  if (typeof route.params.forumId !== 'string') {
    return '';
  }
  return route.params.forumId;
});

interface MenuItem {
  text: string;
  testId: string;
  action: () => void;
}

const menuItems: MenuItem[] = [
  {
    text: '+ New Discussion',
    testId: 'create-discussion-menu-item',
    action: () =>
      router.push(
        channelId.value
          ? `/forums/${channelId.value}/discussions/create`
          : '/discussions/create'
      ),
  },
  {
    text: '+ New Event',
    testId: 'create-event-menu-item',
    action: () =>
      router.push(
        channelId.value
          ? `/forums/${channelId.value}/events/create`
          : '/events/create'
      ),
  },
  {
    text: '+ New Forum',
    testId: 'create-channel-menu-item',
    action: () => router.push('/forums/create'),
  },
];

const isMenuOpen = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const floatingRef = ref<HTMLElement | null>(null);

const { floatingStyles } = useFloating(triggerRef, floatingRef, {
  placement: 'bottom-end',
  strategy: 'fixed',
  middleware: [offset(4), flip(), shift({ padding: 8 })],
  whileElementsMounted: autoUpdate,
});

function toggle() {
  isMenuOpen.value = !isMenuOpen.value;
}

const handleItemClick = (item: MenuItem) => {
  item.action();
  isMenuOpen.value = false;
};

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node;
  if (
    triggerRef.value?.contains(target) ||
    floatingRef.value?.contains(target)
  ) {
    return;
  }
  isMenuOpen.value = false;
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') isMenuOpen.value = false;
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
  isMenuOpen.value = false;
}

watch(isMenuOpen, (open) => {
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

const buttonClasses = computed(() => {
  if (createButtonProps.iconOnly) {
    return 'flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:focus:ring-gray-500 dark:focus:ring-offset-gray-900';
  }

  const baseClasses =
    'inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-2 text-xs focus:outline-none dark:border-gray-600';

  if (createButtonProps.usePrimaryButton) {
    return `${baseClasses} !border !border-gray-300 dark:!border-gray-600`;
  }

  if (createButtonProps.backgroundColor === 'light') {
    return `${baseClasses} bg-white text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-700`;
  }

  return `${baseClasses} bg-white text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700`;
});
</script>

<template>
  <RequireAuth class="align-middle" :full-width="false">
    <template #has-auth>
      <client-only>
        <div class="inline-block align-middle">
          <div ref="triggerRef" class="inline-block" @focusout="onFocusOut">
            <button
              type="button"
              :class="buttonClasses"
              aria-haspopup="menu"
          <div ref="triggerRef" class="inline-block" @focusout="onFocusOut">
            <button
              type="button"
              :class="buttonClasses"
              aria-haspopup="menu"
              :aria-expanded="isMenuOpen"
              @click="toggle"
            >
              <span
                v-if="!iconOnly"
                class="flex items-center whitespace-nowrap"
              >
                {{ usePrimaryButton ? 'Create' : '+ Add' }}
              </span>
              <span
                v-else
                aria-hidden="true"
                class="-mt-0.5 text-4xl font-light leading-none"
              >
                +
              </span>
              <span v-if="iconOnly" class="sr-only">Create new</span>
              <ChevronDownIcon
                v-if="!iconOnly"
                class="-mr-1 ml-1 mt-0.5 h-3 w-3"
                aria-hidden="true"
              />
            </button>
          </div>

          <Teleport to="body">
            <div
              v-if="isMenuOpen"
              ref="floatingRef"
              :style="floatingStyles"
              class="z-[10000]"
              @focusout="onFocusOut"
            >
              <div
                class="min-w-[12rem] overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700 dark:text-gray-200"
                role="menu"
              >
                <button
                  v-for="(item, index) in menuItems"
                  :key="index"
                  type="button"
                  :data-testid="item.testId"
                  role="menuitem"
                  class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
                  @click="handleItemClick(item)"
                >
                  {{ item.text }}
                </button>
              </div>
            </div>
          </Teleport>
        </div>
        <template #fallback>
          <button
            :class="buttonClasses"
            data-testid="fake-create-anything-button"
          >
            <span v-if="!iconOnly" class="flex items-center">
              + {{ usePrimaryButton ? 'Create' : '' }}
            </span>
            <span
              v-else
              aria-hidden="true"
              class="-mt-0.5 text-4xl font-light leading-none"
            >
              +
            </span>
            <span v-if="iconOnly" class="sr-only">Create new</span>
            <ChevronDownIcon
              v-if="!iconOnly"
              class="-mr-1 ml-1 mt-0.5 h-3 w-3"
              aria-hidden="true"
            />
          </button>
        </template>
      </client-only>
    </template>

    <template #does-not-have-auth>
      <button :class="buttonClasses" data-testid="fake-create-anything-button">
        <span v-if="!iconOnly" class="flex items-center">
          + {{ usePrimaryButton ? 'Create' : '' }}
        </span>
        <span v-else aria-hidden="true" class="text-2xl leading-none"> + </span>
        <span v-if="iconOnly" class="sr-only">Create new</span>
        <ChevronDownIcon
          v-if="!iconOnly"
          class="-mr-1 ml-1 mt-0.5 h-3 w-3"
          aria-hidden="true"
        />
      </button>
    </template>
  </RequireAuth>
</template>
