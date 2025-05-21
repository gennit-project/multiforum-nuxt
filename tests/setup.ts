import { vi } from "vitest";

// Suppress Vue compiler warnings
const originalConsoleWarn = console.warn;
console.warn = function (msg, ...args) {
  // Skip Vue compiler macro warnings
  if (
    typeof msg === "string" &&
    (msg.includes("`defineProps` is a compiler macro") ||
      msg.includes("`defineExpose` is a compiler macro"))
  ) {
    return;
  }
  originalConsoleWarn(msg, ...args);
};

// Mock components that might cause issues
vi.mock("vuemoji-picker", () => ({
  default: {
    name: "VuemojiPicker",
    template: '<div data-testid="vuemoji-picker"></div>',
    emits: ["emojiClick", "close"],
  },
}));

// Mock the Tab components from @headlessui/vue
vi.mock("@headlessui/vue", () => ({
  Tab: {
    name: "Tab",
    template: "<button><slot></slot></button>",
  },
  TabGroup: {
    name: "TabGroup",
    template: "<div><slot></slot></div>",
  },
  TabList: {
    name: "TabList",
    template: "<div><slot></slot></div>",
  },
  TabPanel: {
    name: "TabPanel",
    template: "<div><slot></slot></div>",
  },
  TabPanels: {
    name: "TabPanels",
    template: "<div><slot></slot></div>",
  },
}));

// Mock nuxt composables/utilities
vi.mock("#imports", () => ({
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
}));
