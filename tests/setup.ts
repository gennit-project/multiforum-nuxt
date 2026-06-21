import { vi, beforeEach } from 'vitest';
import { ref } from 'vue';

// Minimal request-scoped-ish useState shim for unit tests (happy-dom has no
// Nuxt runtime). Keyed ref store, cleared between tests so auth state from one
// test can't leak into the next. Composables in composables/useAuthState.ts call
// useState from '#imports'; this backs them. Tests that need specific auth state
// should mock '@/composables/useAuthState' directly.
const __useStateStore = new Map<string, ReturnType<typeof ref>>();
beforeEach(() => {
  __useStateStore.clear();
});
const useStateShim = <T>(key: string, init?: () => T) => {
  if (!__useStateStore.has(key)) {
    __useStateStore.set(key, ref(init ? init() : undefined));
  }
  return __useStateStore.get(key) as ReturnType<typeof ref>;
};

// Suppress Vue compiler warnings
const originalConsoleWarn = console.warn;
console.warn = function (msg, ...args) {
  // Skip Vue compiler macro warnings
  if (
    typeof msg === 'string' &&
    (msg.includes('`defineProps` is a compiler macro') ||
      msg.includes('`defineExpose` is a compiler macro'))
  ) {
    return;
  }
  originalConsoleWarn(msg, ...args);
};

// Mock components that might cause issues
vi.mock('vuemoji-picker', () => ({
  default: {
    name: 'VuemojiPicker',
    template: '<div data-testid="vuemoji-picker"></div>',
    emits: ['emojiClick', 'close'],
  },
}));

// Mock the Tab components from @headlessui/vue
vi.mock('@headlessui/vue', () => ({
  Tab: {
    name: 'Tab',
    template: '<button><slot></slot></button>',
  },
  TabGroup: {
    name: 'TabGroup',
    template: '<div><slot></slot></div>',
  },
  TabList: {
    name: 'TabList',
    template: '<div><slot></slot></div>',
  },
  TabPanel: {
    name: 'TabPanel',
    template: '<div><slot></slot></div>',
  },
  TabPanels: {
    name: 'TabPanels',
    template: '<div><slot></slot></div>',
  },
}));

// Mock nuxt composables/utilities
vi.mock('#imports', () => ({
  useNuxtApp: () => ({
    $apollo: {
      default: {
        query: vi.fn().mockResolvedValue({ data: {} }),
      },
    },
  }),
  useRoute: () => ({
    params: {},
    query: {},
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
  navigateTo: vi.fn(),
  useState: useStateShim,
}));

// composables/useAuthState.ts imports useState from 'nuxt/app'. Back it with the
// same shim so components that exercise the real auth composables (rather than
// mocking '@/composables/useAuthState') don't crash in happy-dom. Spec files that
// declare their own vi.mock('nuxt/app', ...) override this for that file.
vi.mock('nuxt/app', () => ({
  useState: useStateShim,
  useNuxtApp: () => ({
    $apollo: {
      default: { query: vi.fn().mockResolvedValue({ data: {} }) },
    },
  }),
  useRoute: () => ({ params: {}, query: {} }),
  useRouter: () => ({ push: vi.fn() }),
  navigateTo: vi.fn(),
  defineNuxtPlugin: (fn: unknown) => fn,
  useRuntimeConfig: () => ({ public: {} }),
}));
