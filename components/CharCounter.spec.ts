import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import CharCounter from '@/components/CharCounter.vue';

const mountCounter = (props: Record<string, unknown>) =>
  mountWithDefaults(CharCounter, { props });

// v-show toggles inline display; check that directly (happy-dom's isVisible is
// unreliable for v-show here).
const isShown = (el: Element) => (el as HTMLElement).style.display !== 'none';

describe('CharCounter', () => {
  it('shows the over-limit warning in red when past the max', () => {
    const wrapper = mountCounter({ current: 110, max: 100 });
    expect(isShown(wrapper.get('[class*="text-red-400"]').element)).toBe(true);
  });

  it('reports the negative remaining count when over the limit', () => {
    const wrapper = mountCounter({ current: 110, max: 100 });
    expect(wrapper.get('[class*="text-red-400"]').text()).toContain('-10/100');
  });

  it('hides the over-limit warning when comfortably within the max', () => {
    const wrapper = mountCounter({ current: 10, max: 100 });
    expect(isShown(wrapper.get('[class*="text-red-400"]').element)).toBe(false);
  });

  it('shows the remaining-count warning when nearing the limit', () => {
    const wrapper = mountCounter({ current: 80, max: 100 });
    // First gray block is the "characters remaining" warning.
    const warning = wrapper.get('[class*="text-gray-500"]');
    expect(isShown(warning.element) && warning.text().includes('20/100')).toBe(
      true
    );
  });

  it('shows the minimum warning when below the minimum', () => {
    const wrapper = mountCounter({ current: 2, max: 100, min: 5 });
    const minWarning = wrapper
      .findAll('div')
      .find((d) => d.text().includes('Minimum of 5 characters'));
    expect(minWarning && isShown(minWarning.element)).toBe(true);
  });
});
