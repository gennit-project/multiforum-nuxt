import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia, storeToRefs  } from 'pinia';
import { computed } from 'vue';
import { mount } from '@vue/test-utils';
import { useUIStore, type FontSize } from '@/stores/uiStore';

/**
 * This test focuses on the integration between components and the UI store
 * using simplified component implementations that match the original structure.
 */

// Mock the config
vi.mock('@/config', () => ({
  config: {
    environment: 'test'
  }
}));

// Mock Nuxt composables
vi.mock('nuxt/app', () => ({
  useCookie: vi.fn(() => ({ value: 'dark' })),
  useRoute: vi.fn(() => ({ path: '/test', query: {} })),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() }))
}));

// We need to create a minimal version of the actual ThemeSwitcher component
// that uses the real uiStore but with simplified structure
const createThemeSwitcherComponent = () => ({
  name: 'ThemeSwitcher',
  template: `
    <button 
      class="toggle-button"
      data-testid="theme-switcher"
      @click="toggleTheme"
    >
      <span class="sr-only">Toggle theme</span>
      <span class="toggle-circle">
        <span class="icon light-icon">
          <i class="fa-sun"></i>
        </span>
        <span class="icon dark-icon">
          <i class="fa-moon"></i>
        </span>
      </span>
    </button>
  `,
  setup() {
    const uiStore = useUIStore();
    const { theme } = storeToRefs(uiStore);
    
    const isDarkMode = computed(() => theme.value === 'dark');
    
    const toggleTheme = () => {
      uiStore.setTheme(isDarkMode.value ? 'light' : 'dark');
    };
    
    return {
      toggleTheme
    };
  }
});

// Create a simplified FontSizeControl component
const createFontSizeComponent = () => ({
  name: 'FontSizeControl',
  template: `
    <div class="font-size-control">
      <div class="font-size-label">Font Size</div>
      <div class="radio-buttons">
        <div v-for="option in options" :key="option.value" class="radio-option">
          <input
            type="radio"
            :value="option.value"
            :id="option.value"
            name="fontSize"
            :checked="uiStore.fontSize === option.value"
            @change="updateFontSize(option)"
            :data-testid="'fontSize-' + option.value"
          />
          <label :for="option.value">{{ option.label }}</label>
        </div>
      </div>
    </div>
  `,
  setup() {
    const uiStore = useUIStore();
    
    const options = [
      { label: "Small", value: "small" },
      { label: "Medium", value: "medium" },
      { label: "Large", value: "large" }
    ];
    
    const updateFontSize = (option: { label: string, value: string }) => {
      uiStore.setFontSize(option.value as FontSize);
    };
    
    return {
      uiStore,
      options, 
      updateFontSize
    };
  }
});

// Create a simplified HamburgerMenuButton component
const createHamburgerMenuComponent = () => ({
  name: 'HamburgerMenuButton',
  template: `
    <button
      data-testid="hamburger-menu-button"
      class="hamburger-button"
      @click="toggleMenu"
    >
      <span class="sr-only">Open menu</span>
      <svg class="icon" viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  `,
  setup() {
    const uiStore = useUIStore();
    
    const toggleMenu = () => {
      uiStore.setSideNavIsOpen(!uiStore.sideNavIsOpen);
    };
    
    return { toggleMenu };
  }
});

describe('UIStore Component Integration Tests', () => {
  beforeEach(() => {
    // Set up fresh Pinia instance for each test
    setActivePinia(createPinia());
    
    // Mock environment
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn()
      }))
    });
    
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: {
        getItem: vi.fn(),
        setItem: vi.fn()
      }
    });
    
    const classListMock = {
      add: vi.fn(),
      remove: vi.fn()
    };
    
    if (!document.documentElement) {
      Object.defineProperty(document, 'documentElement', {
        value: { classList: classListMock },
        writable: true
      });
    } else {
      document.documentElement.classList = classListMock;
    }
    
    // Mock import.meta
    vi.stubGlobal('import', {
      meta: {
        client: true,
        server: false
      }
    });
    
    vi.clearAllMocks();
  });
  
  describe('Theme switcher component', () => {
    it('should toggle the store theme when the toggle button is clicked', async () => {
      // Create the ThemeSwitcher component 
      const ThemeSwitcher = createThemeSwitcherComponent();
      const wrapper = mount(ThemeSwitcher);
      
      // Get a reference to the store
      const store = useUIStore();
      
      // Initial theme should be 'dark' (our new default)
      expect(store.themeMode).toBe('dark');
      
      // Click the toggle button (should switch to light)
      await wrapper.find('[data-testid="theme-switcher"]').trigger('click');
      
      // Verify the store was updated to light mode
      expect(store.themeMode).toBe('light');
      
      // Click the toggle button again (should switch back to dark)
      await wrapper.find('[data-testid="theme-switcher"]').trigger('click');
      
      // Verify the store was updated back to dark mode
      expect(store.themeMode).toBe('dark');
    });
  });
  
  describe('Font size control component', () => {
    it('should update the store fontSize when different sizes are selected', async () => {
      // Create the FontSizeControl component
      const FontSizeControl = createFontSizeComponent();
      const wrapper = mount(FontSizeControl);
      
      // Get a reference to the store
      const store = useUIStore();
      
      // Initial font size should be 'small'
      expect(store.fontSize).toBe('small');
      
      // Click the medium font size option
      await wrapper.find('[data-testid="fontSize-medium"]').setValue(true);
      await wrapper.find('[data-testid="fontSize-medium"]').trigger('change');
      
      // Verify the store was updated
      expect(store.fontSize).toBe('medium');
      
      // Click the large font size option
      await wrapper.find('[data-testid="fontSize-large"]').setValue(true);
      await wrapper.find('[data-testid="fontSize-large"]').trigger('change');
      
      // Verify the store was updated
      expect(store.fontSize).toBe('large');
    });
  });
  
  describe('Hamburger menu button component', () => {
    it('should toggle the sideNavIsOpen state in the store when clicked', async () => {
      // Create the HamburgerMenuButton component
      const HamburgerMenuButton = createHamburgerMenuComponent();
      const wrapper = mount(HamburgerMenuButton);
      
      // Get a reference to the store
      const store = useUIStore();
      
      // Initial state should be closed (false)
      expect(store.sideNavIsOpen).toBe(false);
      
      // Click the hamburger button
      await wrapper.trigger('click');
      
      // Verify the store was updated to open (true)
      expect(store.sideNavIsOpen).toBe(true);
      
      // Click the hamburger button again
      await wrapper.trigger('click');
      
      // Verify the store was updated back to closed (false)
      expect(store.sideNavIsOpen).toBe(false);
    });
  });
});