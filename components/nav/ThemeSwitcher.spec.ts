import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import ThemeSwitcher from '@/components/nav/ThemeSwitcher.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const h = vi.hoisted(() => ({
  theme: null as unknown as { value: string },
  setTheme: vi.fn(),
}));

h.theme = ref('dark');

vi.mock('@/stores/uiStore', () => ({
  useUIStore: () => ({
    setTheme: h.setTheme,
  }),
}));

vi.mock('pinia', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  storeToRefs: () => ({
    theme: h.theme,
  }),
}));

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.theme.value = 'dark';
  });

  it('reflects dark mode in the switch aria state', () => {
    const wrapper = mountWithDefaults(ThemeSwitcher);

    expect(wrapper.get('[data-testid="theme-switcher"]').attributes('aria-checked')).toBe(
      'true'
    );
  });

  it('switches from dark to light when clicked', async () => {
    const wrapper = mountWithDefaults(ThemeSwitcher);

    await wrapper.get('[data-testid="theme-switcher"]').trigger('click');

    expect(h.setTheme).toHaveBeenCalledWith('light');
  });

  it('switches from light to dark when clicked', async () => {
    h.theme.value = 'light';
    const wrapper = mountWithDefaults(ThemeSwitcher);

    await wrapper.get('[data-testid="theme-switcher"]').trigger('click');

    expect(h.setTheme).toHaveBeenCalledWith('dark');
  });
});
