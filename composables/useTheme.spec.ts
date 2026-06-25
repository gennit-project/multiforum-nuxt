import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';

// Reactive stand-in for the uiStore theme, so we can verify that useAppTheme
// reflects store changes and delegates writes back to the store.
const themeRef = ref<'light' | 'dark'>('dark');
const setThemeMock = vi.fn((mode: 'light' | 'dark') => {
  themeRef.value = mode;
});

describe('useAppTheme - delegates to the uiStore', () => {
  beforeEach(() => {
    vi.resetModules();
    themeRef.value = 'dark';
    setThemeMock.mockClear();

    vi.mock('@/stores/uiStore', () => ({
      useUIStore: () => ({
        get theme() {
          return themeRef.value;
        },
        setTheme: setThemeMock,
      }),
    }));
  });

  it('exposes the current store theme', async () => {
    const { useAppTheme } = await import('@/composables/useTheme');
    expect(useAppTheme().theme.value).toBe('dark');
  });

  it('reacts to store theme changes', async () => {
    const { useAppTheme } = await import('@/composables/useTheme');
    const { theme } = useAppTheme();
    themeRef.value = 'light';
    expect(theme.value).toBe('light');
  });

  it('delegates a valid setTheme call to the store', async () => {
    const { useAppTheme } = await import('@/composables/useTheme');
    useAppTheme().setTheme('light');
    expect(setThemeMock).toHaveBeenCalledWith('light');
  });

  it('ignores invalid setTheme values', async () => {
    const { useAppTheme } = await import('@/composables/useTheme');
    useAppTheme().setTheme('system');
    expect(setThemeMock).not.toHaveBeenCalled();
  });
});
