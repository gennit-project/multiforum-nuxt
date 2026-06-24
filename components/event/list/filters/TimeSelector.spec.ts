import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import TimeSelector from '@/components/event/list/filters/TimeSelector.vue';
import { hourRangesData } from '@/components/event/list/filters/eventSearchOptions';

const firstLabel = hourRangesData[0]['12-hour-label'];

const mountSelector = (selectedHourRanges: Record<string, boolean> = {}) =>
  mount(TimeSelector, {
    props: { selectedHourRanges },
    global: {
      stubs: {
        ResetButton: { name: 'ResetButton', emits: ['reset'], template: '<button class="reset" @click="$emit(\'reset\')" />' },
      },
    },
  });

const checkbox = (w: ReturnType<typeof mount>, label: string) =>
  w.find(`[data-testid="timeRange-${label}"]`);

describe('TimeSelector rendering', () => {
  it('renders a checkbox per hour range', () => {
    const wrapper = mountSelector();

    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(
      hourRangesData.length
    );
  });

  it('checks a range that is already selected', () => {
    const wrapper = mountSelector({ [firstLabel]: true });

    expect(
      (checkbox(wrapper, firstLabel).element as HTMLInputElement).checked
    ).toBe(true);
  });
});

describe('TimeSelector selection', () => {
  it('emits the selected range when toggled on', async () => {
    const wrapper = mountSelector();

    await checkbox(wrapper, firstLabel).trigger('input');

    expect(wrapper.emitted('updateHourRanges')?.[0]?.[0]).toContain(firstLabel);
  });

  it('removes a range when toggled off', async () => {
    const wrapper = mountSelector({ [firstLabel]: true });

    await checkbox(wrapper, firstLabel).trigger('input');

    expect(wrapper.emitted('updateHourRanges')?.[0]?.[0]).not.toContain(
      firstLabel
    );
  });

  it('emits reset when the reset button fires', async () => {
    const wrapper = mountSelector({ [firstLabel]: true });

    await wrapper.getComponent({ name: 'ResetButton' }).vm.$emit('reset');

    expect(wrapper.emitted('reset')).toBeTruthy();
  });
});
