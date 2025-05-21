import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";

// Instead of using #components, mock each component directly
vi.mock("@/components/nav/HamburgerMenuButton.vue", () => ({
  default: {
    template: '<div class="hamburger">Hamburger Menu</div>',
  },
}));

vi.mock("@/components/nav/UserProfileDropdownMenu.vue", () => ({
  default: {
    props: ["username", "modName"],
    template: '<div class="profile-button">Profile</div>',
  },
}));

vi.mock("@/components/nav/ThemeSwitcher.vue", () => ({
  default: {
    template: '<div class="theme-switcher">Theme</div>',
  },
}));

vi.mock("@/components/nav/CreateAnythingButton.vue", () => ({
  default: {
    template: '<div class="create-button">Create</div>',
  },
}));

vi.mock("@/components/icons/LogoIcon.vue", () => ({
  default: {
    template: '<div class="site-logo">Logo</div>',
  },
}));

vi.mock("@/components/nav/LoginButton.vue", () => ({
  default: {
    template: '<div class="login-button">Login</div>',
  },
}));

// Mock the ref data from cache.ts
vi.mock("@/cache", () => ({
  modProfileNameVar: "mockModName",
  usernameVar: "mockUsername",
  sideNavIsOpenVar: false,
  notificationCountVar: 0,
}));

// Mock nuxt/app and useRoute
vi.mock("nuxt/app", () => ({
  useRoute: () => ({
    name: "test",
    params: { forumId: "test-forum" },
  }),
}));

// Mock config
vi.mock("@/config", () => ({
  config: {
    environment: "development",
  },
}));

describe("Topnav Component", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should render all navigation elements when authenticated", async () => {
    // Set up mocks for authenticated state
    vi.mock("@/cache", () => ({
      modProfileNameVar: "mockModName",
      usernameVar: "mockUsername", // This indicates user is authenticated
      sideNavIsOpenVar: false,
      notificationCountVar: 0,
    }));

    // Get component after mocks are set up
    const Topnav = await import("@/components/nav/Topnav.vue").then((m) => m.default);

    const wrapper = mount(Topnav, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          "nuxt-link": {
            template: "<a><slot /></a>",
            props: ["to"],
          },
        },
      },
    });

    // Component should render
    expect(wrapper.exists()).toBe(true);

    // Key UI elements should be present
    expect(wrapper.find(".site-logo").exists()).toBe(true);
    expect(wrapper.find(".hamburger").exists()).toBe(true);
    expect(wrapper.find(".create-button").exists()).toBe(true);
    expect(wrapper.find(".theme-switcher").exists()).toBe(true);

    // User-specific elements should be visible when authenticated
    expect(wrapper.find('[data-testid="notification-bell"]').exists()).toBe(true);
  });

  it("should not show auth-dependent elements when not authenticated", async () => {
    // Set up mocks for unauthenticated state
    vi.mock("@/cache", () => ({
      modProfileNameVar: "",
      usernameVar: "", // Empty username indicates not authenticated
      sideNavIsOpenVar: false,
      notificationCountVar: 0,
    }));

    // Get component after mocks are set up
    const Topnav = await import("@/components/nav/Topnav.vue").then((m) => m.default);

    const wrapper = mount(Topnav, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          "nuxt-link": {
            template: "<a><slot /></a>",
            props: ["to"],
          },
        },
      },
    });

    // Login button should be present
    expect(wrapper.find(".login-button").exists()).toBe(true);

    // User-specific elements should not be visible when not authenticated
    expect(wrapper.find(".profile-button").exists()).toBe(false);
  });
});
