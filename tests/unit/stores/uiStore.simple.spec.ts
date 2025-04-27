import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

describe('uiStore - Simple API Tests', () => {
  beforeEach(() => {
    vi.resetModules();
    
    // Create fresh pinia for each test
    setActivePinia(createPinia());
    
    // Simplest possible mocks for browser APIs
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn()
    });
    
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn()
    }));
    
    // Mock document APIs
    document.documentElement.classList = {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn()
    } as any;
    
    // Mock Nuxt composables
    vi.mock('nuxt/app', () => ({
      useCookie: () => ({ value: null }),
      useRoute: () => ({ query: {} }),
      useRouter: () => ({ replace: vi.fn() })
    }));
    
    // Mock import.meta.client
    vi.stubGlobal('import', {
      meta: { client: true }
    });
    
    // Mock config
    vi.mock('@/config', () => ({
      config: { environment: 'test' }
    }));
  });
  
  it('should initialize with default values', async () => {
    const { useUIStore } = await import('@/stores/uiStore');
    const store = useUIStore();
    
    expect(store.sideNavIsOpen).toBe(false);
    expect(store.fontSize).toBe('small');
    expect(store.themeMode).toBe('system');
  });
  
  it('should properly update simple state values', async () => {
    const { useUIStore } = await import('@/stores/uiStore');
    const store = useUIStore();
    
    // Test sideNavIsOpen
    store.setSideNavIsOpen(true);
    expect(store.sideNavIsOpen).toBe(true);
    
    // Test fontSize
    store.setFontSize('large');
    expect(store.fontSize).toBe('large');
    
    // Test theme
    store.setTheme('dark');
    expect(store.themeMode).toBe('dark');
    expect(store.theme).toBe('dark');
    
    store.setTheme('light');
    expect(store.themeMode).toBe('light');
    expect(store.theme).toBe('light');
  });
  
  it('should handle theme computation when system is selected', async () => {
    const { useUIStore } = await import('@/stores/uiStore');
    const store = useUIStore();
    
    // Set to system theme
    store.setTheme('system');
    expect(store.themeMode).toBe('system');
    
    // Default system theme should be light based on our matchMedia mock
    expect(store.theme).toBe('light');
  });
});