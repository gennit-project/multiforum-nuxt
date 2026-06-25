import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';

// Reactive stand-in for the uiStore theme, so we can verify that useAppTheme
// reflects store changes and delegates writes back to the store. Named with a
// `mock` prefix so the hoisted top-level vi.mock factory may reference them.
const mockThemeRef = ref<'light' | 'dark'>('dark');
const mockSetTheme = vi.fn((mode: 'light' | 'dark') => {
  mockThemeRef.value = mode;
});

// Hoisted to the top of the module by Vitest, so it must live at the top level.
vi.mock('@/stores/uiStore', () => ({
  useUIStore: () => ({
    get theme() {
      return mockThemeRef.value;
    },
    setTheme: mockSetTheme,
  }),
}));

describe('useAppTheme - delegates to the uiStore', () => {
  beforeEach(() => {
    vi.resetModules();
    mockThemeRef.value = 'dark';
    mockSetTheme.mockClear();
  });

  it('exposes the current store theme', async () => {
    const { useAppTheme } = await import('@/composables/useTheme');
    expect(useAppTheme().theme.value).toBe('dark');
  });

  it('reacts to store theme changes', async () => {
    const { useAppTheme } = await import('@/composables/useTheme');
    const { theme } = useAppTheme();
    mockThemeRef.value = 'light';
    expect(theme.value).toBe('light');
  });

  it('delegates a valid setTheme call to the store', async () => {
    const { useAppTheme } = await import('@/composables/useTheme');
    useAppTheme().setTheme('light');
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('ignores invalid setTheme values', async () => {
    const { useAppTheme } = await import('@/composables/useTheme');
    useAppTheme().setTheme('system');
    expect(mockSetTheme).not.toHaveBeenCalled();
  });
});
