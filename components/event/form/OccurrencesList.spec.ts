import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OccurrencesList from '@/components/event/form/OccurrencesList.vue';
import type { DateOccurrence } from '@/types/Event';

const occ = (startTime: string, endTime: string) =>
  ({ startTime, endTime }) as DateOccurrence;

const pickerStub = (name: string) => ({
  name,
  props: ['testId', 'value', 'ariaLabel'],
  emits: ['update'],
  template: '<div />',
});

const mountList = (
  occurrences: DateOccurrence[],
  props: Record<string, unknown> = {}
) =>
  mount(OccurrencesList, {
    props: { occurrences, ...props },
    global: {
      stubs: {
        DatePicker: pickerStub('DatePicker'),
        TimePicker: pickerStub('TimePicker'),
      },
    },
  });

const oneOccurrence = () => [
  occ('2024-06-01T10:00:00Z', '2024-06-01T12:00:00Z'),
];

describe('OccurrencesList rendering', () => {
  it('renders one date row per occurrence', () => {
    const wrapper = mountList([
      occ('2024-06-01T10:00:00Z', '2024-06-01T12:00:00Z'),
      occ('2024-06-02T10:00:00Z', '2024-06-02T12:00:00Z'),
    ]);

    expect(wrapper.findAllComponents({ name: 'DatePicker' })).toHaveLength(2);
  });

  it('hides the time pickers when isAllDay is true', () => {
    const wrapper = mountList(oneOccurrence(), { isAllDay: true });

    expect(wrapper.findAllComponents({ name: 'TimePicker' })).toHaveLength(0);
  });

  it('shows start and end time pickers when not all-day', () => {
    const wrapper = mountList(oneOccurrence());

    expect(wrapper.findAllComponents({ name: 'TimePicker' })).toHaveLength(2);
  });

  it('passes a formatted yyyy-MM-dd value to the date picker', () => {
    const wrapper = mountList(oneOccurrence());

    expect(
      wrapper.getComponent({ name: 'DatePicker' }).props('value')
    ).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('passes an empty date value when the start time is invalid', () => {
    const wrapper = mountList([occ('not-a-date', 'also-bad')]);

    expect(wrapper.getComponent({ name: 'DatePicker' }).props('value')).toBe('');
  });
});

describe('OccurrencesList labels', () => {
  it('renders a readable date label for a valid occurrence', () => {
    const wrapper = mountList(oneOccurrence());

    expect(wrapper.text()).toMatch(/\w{3}, \w{3} \d/);
  });

  it('falls back to a numbered label when the date is invalid', () => {
    const wrapper = mountList([occ('garbage', 'garbage')]);

    expect(wrapper.text()).toContain('Date 1');
  });
});

describe('OccurrencesList editing', () => {
  it('syncs both dates to the chosen day on a start-date change', async () => {
    const wrapper = mountList(oneOccurrence());

    await wrapper
      .getComponent({ name: 'DatePicker' })
      .vm.$emit('update', '2024-07-15');

    const payload = wrapper.emitted('update')?.[0];
    expect(payload?.[1]).toMatchObject({
      startTime: expect.stringContaining('2024-07-15'),
      endTime: expect.stringContaining('2024-07-15'),
    });
  });

  it('updates the start time on a start-time change', async () => {
    const wrapper = mountList(oneOccurrence());

    await wrapper
      .findAllComponents({ name: 'TimePicker' })[0]
      .vm.$emit('update', '14:30');

    expect((wrapper.emitted('update')?.[0]?.[1] as DateOccurrence).startTime).toContain(
      'T14:30'
    );
  });

  it('updates the end time on an end-time change', async () => {
    const wrapper = mountList(oneOccurrence());

    await wrapper
      .findAllComponents({ name: 'TimePicker' })[1]
      .vm.$emit('update', '16:45');

    expect((wrapper.emitted('update')?.[0]?.[1] as DateOccurrence).endTime).toContain(
      'T16:45'
    );
  });

  it('ignores a start-date change when the new date is invalid', async () => {
    const wrapper = mountList(oneOccurrence());

    await wrapper
      .getComponent({ name: 'DatePicker' })
      .vm.$emit('update', 'not-a-date');

    expect(wrapper.emitted('update')).toBeUndefined();
  });
});

describe('OccurrencesList add / remove', () => {
  it('emits add with default start and end times', async () => {
    const wrapper = mountList(oneOccurrence());

    await wrapper.get('[data-testid="add-occurrence-button"]').trigger('click');

    expect(wrapper.emitted('add')?.[0]?.[0]).toHaveProperty('startTime');
  });

  it('emits remove with the occurrence index', async () => {
    const wrapper = mountList([
      occ('2024-06-01T10:00:00Z', '2024-06-01T12:00:00Z'),
      occ('2024-06-02T10:00:00Z', '2024-06-02T12:00:00Z'),
    ]);

    await wrapper.get('[data-testid="remove-occurrence-1"]').trigger('click');

    expect(wrapper.emitted('remove')?.[0]).toEqual([1]);
  });

  it('hides the remove button when only one occurrence remains', () => {
    const wrapper = mountList(oneOccurrence());

    expect(wrapper.find('[data-testid="remove-occurrence-0"]').exists()).toBe(
      false
    );
  });
});
