import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";

// Simplified tests that focus on core Pinia store functionality
// without testing browser APIs that are difficult to mock
describe("uiStore - Core Functionality", () => {
  beforeEach(() => {
    vi.resetModules();

    // Setup a fresh Pinia instance
    setActivePinia(createPinia());

    // Mock config
    vi.mock("@/config", () => ({
      config: { environment: "test" },
    }));

    // Simple mock of browser APIs without expectations on them
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });

    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
    }));

    // Mock document
    document.documentElement.classList = {
      add: vi.fn(),
      remove: vi.fn(),
    } as any;

    // Mock import.meta
    vi.stubGlobal("import", {
      meta: { client: true },
    });

    // Mock Nuxt composables
    vi.mock("nuxt/app", () => ({
      useCookie: () => ({ value: null }),
      useRoute: () => ({ query: {} }),
      useRouter: () => ({ replace: vi.fn() }),
    }));
  });

  it("should initialize with default values", async () => {
    // Import after mocks are in place
    const { useUIStore } = await import("@/stores/uiStore");
    const store = useUIStore();

    expect(store.sideNavIsOpen).toBe(false);
    expect(store.fontSize).toBe("small");
    expect(store.themeMode).toBe("dark"); // Updated to match the new default
  });

  it("should set sideNavIsOpen correctly", async () => {
    const { useUIStore } = await import("@/stores/uiStore");
    const store = useUIStore();

    // Default is false
    expect(store.sideNavIsOpen).toBe(false);

    // Set to true
    store.setSideNavIsOpen(true);
    expect(store.sideNavIsOpen).toBe(true);

    // Set to false
    store.setSideNavIsOpen(false);
    expect(store.sideNavIsOpen).toBe(false);
  });

  it("should set enteredDevelopmentEnvironment correctly", async () => {
    const { useUIStore } = await import("@/stores/uiStore");
    const store = useUIStore();

    // Default is false (from our test environment mock)
    expect(store.enteredDevelopmentEnvironment).toBe(false);

    // Set to true
    store.setEnteredDevelopmentEnvironment(true);
    expect(store.enteredDevelopmentEnvironment).toBe(true);

    // Set to false
    store.setEnteredDevelopmentEnvironment(false);
    expect(store.enteredDevelopmentEnvironment).toBe(false);
  });

  it("should set fontSize correctly", async () => {
    const { useUIStore } = await import("@/stores/uiStore");
    const store = useUIStore();

    // Default is 'small'
    expect(store.fontSize).toBe("small");

    // Set to 'medium'
    store.setFontSize("medium");
    expect(store.fontSize).toBe("medium");

    // Set to 'large'
    store.setFontSize("large");
    expect(store.fontSize).toBe("large");
  });

  it("should update themeMode when setting theme", async () => {
    const { useUIStore } = await import("@/stores/uiStore");
    const store = useUIStore();

    // Default is 'dark' in our new implementation
    expect(store.themeMode).toBe("dark");

    // Set to 'light'
    store.setTheme("light");
    expect(store.themeMode).toBe("light");

    // Set back to 'dark'
    store.setTheme("dark");
    expect(store.themeMode).toBe("dark");
  });
});
