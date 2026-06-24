import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DateRangeGroup from '@/components/event/form/DateRangeGroup.vue';
import type { DateRangeGroup as DRG } from '@/types/Event';

const group = (overrides: Partial<DRG> = {}): DRG =>
  ({
    startDate: '2024-06-01',
    endDate: '2024-06-01',
    startTimeOfDay: '09:00',
    endTimeOfDay: '17:00',
    ...overrides,
  }) as DRG;

const pickerStub = (name: string) => ({
  name,
  props: ['testId', 'value', 'ariaLabel'],
  emits: ['update'],
  template: '<div />',
});

const mountGroups = (groups: DRG[], props: Record<string, unknown> = {}) =>
  mount(DateRangeGroup, {
    props: { groups, ...props },
    global: {
      stubs: {
        DatePicker: pickerStub('DatePicker'),
        TimePicker: pickerStub('TimePicker'),
      },
    },
  });

describe('DateRangeGroup rendering', () => {
  it('renders a card per group', () => {
    const wrapper = mountGroups([group(), group({ startDate: '2024-07-01', endDate: '2024-07-01' })]);

    expect(wrapper.findAllComponents({ name: 'DatePicker' })).toHaveLength(4);
  });

  it('hides time pickers when all-day', () => {
    const wrapper = mountGroups([group()], { isAllDay: true });

    expect(wrapper.findAllComponents({ name: 'TimePicker' })).toHaveLength(0);
  });

  it('hides the remove button for a single group', () => {
    const wrapper = mountGroups([group()]);

    expect(wrapper.find('[data-testid="remove-group-0"]').exists()).toBe(false);
  });
});

describe('DateRangeGroup labels', () => {
  it('labels a single day with weekday and date', () => {
    const wrapper = mountGroups([group()]);

    expect(wrapper.text()).toContain('Jun 1');
  });

  it('labels a same-month range compactly', () => {
    const wrapper = mountGroups([group({ endDate: '2024-06-05' })]);

    expect(wrapper.text()).toContain('Jun 1 - 5');
  });

  it('labels a cross-month range with both months', () => {
    const wrapper = mountGroups([group({ endDate: '2024-07-05' })]);

    expect(wrapper.text()).toContain('Jun 1 - Jul 5');
  });

  it('labels invalid dates', () => {
    const wrapper = mountGroups([group({ startDate: 'bad', endDate: 'bad' })]);

    expect(wrapper.text()).toContain('Invalid dates');
  });

  it('shows a day count badge for multi-day ranges', () => {
    const wrapper = mountGroups([group({ endDate: '2024-06-03' })]);

    expect(wrapper.text()).toContain('3 days');
  });
});

describe('DateRangeGroup editing', () => {
  it('emits update for a start-date change', async () => {
    const wrapper = mountGroups([group()]);

    await wrapper.findAllComponents({ name: 'DatePicker' })[0].vm.$emit('update', '2024-07-15');

    expect(wrapper.emitted('update')?.[0]).toEqual([
      0,
      expect.objectContaining({ startDate: '2024-07-15' }),
    ]);
  });

  it('emits update for a start-time change', async () => {
    const wrapper = mountGroups([group()]);

    await wrapper.findAllComponents({ name: 'TimePicker' })[0].vm.$emit('update', '08:30');

    expect(wrapper.emitted('update')?.[0]?.[1]).toMatchObject({
      startTimeOfDay: '08:30',
    });
  });

  it('emits add with default values', async () => {
    const wrapper = mountGroups([group()]);

    await wrapper.get('[data-testid="add-date-range-button"]').trigger('click');

    expect(wrapper.emitted('add')?.[0]?.[0]).toHaveProperty('startDate');
  });

  it('emits remove with the group index', async () => {
    const wrapper = mountGroups([group(), group({ startDate: '2024-07-01', endDate: '2024-07-01' })]);

    await wrapper.get('[data-testid="remove-group-1"]').trigger('click');

    expect(wrapper.emitted('remove')?.[0]).toEqual([1]);
  });
});
