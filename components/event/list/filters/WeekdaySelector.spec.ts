import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import WeekdaySelector from '@/components/event/list/filters/WeekdaySelector.vue';
import { weekdays } from '@/components/event/list/filters/eventSearchOptions';

const firstDay = weekdays[0];

const mountSelector = (selectedWeekdays: Record<string, boolean> = {}) =>
  mount(WeekdaySelector, {
    props: { selectedWeekdays },
    global: {
      stubs: {
        ResetButton: { name: 'ResetButton', emits: ['reset'], template: '<button class="reset" @click="$emit(\'reset\')" />' },
      },
    },
  });

const checkbox = (w: ReturnType<typeof mount>, num: string | number) =>
  w.find(`[data-testid="weekday-${num}-checkbox"]`);

describe('WeekdaySelector rendering', () => {
  it('renders a checkbox per weekday', () => {
    const wrapper = mountSelector();

    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(weekdays.length);
  });

  it('checks a weekday that is already selected', () => {
    const wrapper = mountSelector({ [firstDay.number]: true });

    expect(
      (checkbox(wrapper, firstDay.number).element as HTMLInputElement).checked
    ).toBe(true);
  });
});

describe('WeekdaySelector selection', () => {
  it('emits the selected weekday when toggled on', async () => {
    const wrapper = mountSelector();

    await checkbox(wrapper, firstDay.number).trigger('input');

    expect(wrapper.emitted('updateWeekdays')?.[0]?.[0]).toContain(
      String(firstDay.number)
    );
  });

  it('removes a weekday when toggled off', async () => {
    const wrapper = mountSelector({ [firstDay.number]: true });

    await checkbox(wrapper, firstDay.number).trigger('input');

    expect(wrapper.emitted('updateWeekdays')?.[0]?.[0]).toBe('[]');
  });

  it('emits reset when the reset button fires', async () => {
    const wrapper = mountSelector({ [firstDay.number]: true });

    await wrapper.getComponent({ name: 'ResetButton' }).vm.$emit('reset');

    expect(wrapper.emitted('reset')).toBeTruthy();
  });
});
