import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RepeatPatternPicker from '@/components/event/form/RepeatPatternPicker.vue';
import type { RepeatPattern } from '@/types/Event';

const mountPicker = (props: Record<string, unknown> = {}) =>
  mount(RepeatPatternPicker, {
    props,
    global: {
      stubs: {
        DatePicker: { name: 'DatePicker', props: ['value'], emits: ['update'], template: '<div />' },
      },
    },
  });

const lastPattern = (w: ReturnType<typeof mount>) =>
  w.emitted('update')?.at(-1)?.[0] as RepeatPattern;

describe('RepeatPatternPicker initial emit', () => {
  it('emits a default weekly pattern when none is provided', () => {
    const wrapper = mountPicker();

    expect(lastPattern(wrapper).type).toBe('WEEKLY');
  });

  it('does not emit on mount when a pattern is provided', () => {
    const wrapper = mountPicker({
      pattern: { type: 'DAILY', count: 1, endType: 'NEVER' },
    });

    expect(wrapper.emitted('update')).toBeUndefined();
  });
});

describe('RepeatPatternPicker frequency', () => {
  it('changes the pattern type', async () => {
    const wrapper = mountPicker();

    await wrapper.get('input[name="repeat-type"][value="DAILY"]').trigger('change');

    expect(lastPattern(wrapper).type).toBe('DAILY');
  });

  it('shows a singular interval label for a count of 1', () => {
    const wrapper = mountPicker();

    expect(wrapper.text()).toContain('1 week');
  });

  it('shows a plural interval label for higher counts', async () => {
    const wrapper = mountPicker();

    await wrapper.get('[data-testid="interval-count"]').setValue(3);

    expect(wrapper.text()).toContain('3 weeks');
  });

  it('emits the updated interval count', async () => {
    const wrapper = mountPicker();

    await wrapper.get('[data-testid="interval-count"]').setValue(5);

    expect(lastPattern(wrapper).count).toBe(5);
  });
});

describe('RepeatPatternPicker days of week', () => {
  it('shows day selectors for weekly patterns', () => {
    const wrapper = mountPicker();

    expect(wrapper.find('[data-testid="day-of-week-1"]').exists()).toBe(true);
  });

  it('hides day selectors for non-weekly patterns', async () => {
    const wrapper = mountPicker();
    await wrapper.get('input[name="repeat-type"][value="DAILY"]').trigger('change');

    expect(wrapper.find('[data-testid="day-of-week-1"]').exists()).toBe(false);
  });

  it('toggles a day on', async () => {
    const wrapper = mountPicker();

    await wrapper.get('[data-testid="day-of-week-1"]').trigger('click');

    expect(lastPattern(wrapper).daysOfWeek).toContain(1);
  });

  it('toggles a day back off', async () => {
    const wrapper = mountPicker();
    await wrapper.get('[data-testid="day-of-week-1"]').trigger('click');

    await wrapper.get('[data-testid="day-of-week-1"]').trigger('click');

    expect(lastPattern(wrapper).daysOfWeek).not.toContain(1);
  });

  it('warns when no day is selected', () => {
    const wrapper = mountPicker();

    expect(wrapper.text()).toContain('Select at least one day');
  });
});

describe('RepeatPatternPicker end condition', () => {
  it('omits endCount when ending never', async () => {
    const wrapper = mountPicker();

    await wrapper.get('input[name="end-type"][value="NEVER"]').trigger('change');

    expect(lastPattern(wrapper).endCount).toBeUndefined();
  });

  it('emits endCount for the after-count option', async () => {
    const wrapper = mountPicker();

    await wrapper.get('[data-testid="end-count"]').setValue(7);

    expect(lastPattern(wrapper).endCount).toBe(7);
  });

  it('emits endDate for the on-date option', async () => {
    const wrapper = mountPicker();
    await wrapper.get('input[name="end-type"][value="ON_DATE"]').trigger('change');

    await wrapper.getComponent({ name: 'DatePicker' }).vm.$emit('update', '2025-01-01');

    expect(lastPattern(wrapper).endDate).toBe('2025-01-01');
  });
});
