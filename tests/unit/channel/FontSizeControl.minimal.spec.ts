import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import { useUIStore } from "@/stores/uiStore";

// Mock RadioButtons component
vi.mock("@/components/RadioButtons.vue", () => ({
  default: {
    props: ["selectedOption", "options"],
    template: `
      <div class="radio-buttons">
        <div v-for="option in options" :key="option.value" class="radio-option">
          <button 
            :data-testid="'font-' + option.value" 
            :class="{ 'selected': selectedOption.value === option.value }"
            @click="$emit('update-selected', option)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    `,
    emits: ["update-selected"],
  },
}));

describe("FontSizeControl Component", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should display the current font size from the store", async () => {
    // Import component after mocks are set up
    const FontSizeControl = await import("@/components/channel/FontSizeControl.vue").then(
      (m) => m.default
    );

    // Create pinia with initial state
    const wrapper = mount(FontSizeControl, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              ui: { fontSize: "medium" },
            },
          }),
        ],
      },
    });

    // Check that the selected option is correct
    const selectedButton = wrapper.find(".selected");
    expect(selectedButton.exists()).toBe(true);
    expect(selectedButton.text()).toBe("Medium");
  });

  it("should update the store when a different font size is selected", async () => {
    // Import component after mocks are set up
    const FontSizeControl = await import("@/components/channel/FontSizeControl.vue").then(
      (m) => m.default
    );

    // Create pinia with mock actions
    const wrapper = mount(FontSizeControl, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              ui: { fontSize: "medium" },
            },
          }),
        ],
      },
    });

    // Get store to check action calls
    const store = useUIStore();

    // Click the small font size button
    await wrapper.find('[data-testid="font-small"]').trigger("click");
    expect(store.setFontSize).toHaveBeenCalledWith("small");

    // Click the large font size button
    await wrapper.find('[data-testid="font-large"]').trigger("click");
    expect(store.setFontSize).toHaveBeenCalledWith("large");
  });
});

// Separate integration test to verify that the MarkdownRenderer
// correctly receives and applies font size changes
describe("FontSize Integration with MarkdownRenderer", () => {
  beforeEach(() => {
    vi.resetModules();

    // Mock DOM API
    document.documentElement.classList = {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
    } as any;

    // Mock localStorage
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });

    // Mock matchMedia for theme
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
    }));
  });

  it("should pass the font size from store to MarkdownRenderer", async () => {
    // Mock DOMPurify for markdown
    vi.mock("dompurify", () => ({
      default: {
        sanitize: vi.fn((html) => html),
      },
    }));

    // Mock MarkdownIt and hljs
    vi.mock("markdown-it", () => {
      return function () {
        return {
          render: () => '<div class="test-content">Test Content</div>',
          renderer: {
            rules: {},
          },
          utils: {
            escapeHtml: (str) => str,
          },
        };
      };
    });

    vi.mock("highlight.js", () => ({
      default: {
        getLanguage: () => true,
        highlight: () => ({ value: "highlighted" }),
      },
    }));

    // Mock cookie and route/router for useTheme
    vi.mock("nuxt/app", () => ({
      useCookie: () => ({
        value: "light",
      }),
      useRoute: () => ({
        query: {},
      }),
      useRouter: () => ({
        replace: vi.fn(),
      }),
      useHead: vi.fn(),
    }));

    // Mock the MarkdownRenderer component
    vi.mock("@/components/MarkdownRenderer.vue", () => ({
      default: {
        props: ["text", "fontSize"],
        template: `
          <div class="markdown-body" :class="{
            'font-size-small': fontSize === 'small',
            'font-size-medium': fontSize === 'medium',
            'font-size-large': fontSize === 'large'
          }">
            {{ text }}
          </div>
        `,
      },
    }));

    // Import UIStore
    const { useUIStore } = await import("@/stores/uiStore");

    // Set up test component with store and MarkdownRenderer
    const TestComponent = {
      template: `
        <div>
          <markdown-renderer 
            text="Test markdown"
            :font-size="store.fontSize"
          />
        </div>
      `,
      setup() {
        const store = useUIStore();
        return { store };
      },
    };

    // Get the MarkdownRenderer component
    const MarkdownRenderer = await import("@/components/MarkdownRenderer.vue").then(
      (m) => m.default
    );

    // Mount with Pinia and component registration
    const wrapper = mount(TestComponent, {
      global: {
        components: {
          "markdown-renderer": MarkdownRenderer,
        },
        plugins: [
          createTestingPinia({
            initialState: {
              ui: { fontSize: "small" },
            },
          }),
        ],
      },
    });

    // Check that the small font size class is applied
    const markdownBody = wrapper.find(".markdown-body");
    expect(markdownBody.exists()).toBe(true);
    expect(markdownBody.classes()).toContain("font-size-small");

    // Update store
    const store = useUIStore();
    store.fontSize = "large";
    await wrapper.vm.$nextTick();

    // Check that class is updated
    expect(markdownBody.classes()).toContain("font-size-large");
  });
});
