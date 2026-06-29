import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { DateTime } from 'luxon';
import EventScheduleFields from './EventScheduleFields.vue';
import ErrorMessage from '@/components/ErrorMessage.vue';
import CheckBox from '@/components/CheckBox.vue';
import DateTimePickersRow from './DateTimePickersRow.vue';
import OccurrencesList from './OccurrencesList.vue';
import RepeatPatternPicker from './RepeatPatternPicker.vue';
import type { CreateEditEventFormValues } from '@/types/Event';

// Pull the payload of the Nth updateFormValues emit (each handler emits one).
const emittedUpdate = (
  wrapper: { emitted: (e: string) => unknown[][] | undefined },
  index = 0
) =>
  (wrapper.emitted('updateFormValues')?.[index]?.[0] ?? {}) as Record<
    string,
    unknown
  >;

const checkbox = (
  wrapper: ReturnType<typeof shallowMount>,
  testId: string
) =>
  wrapper
    .findAllComponents(CheckBox)
    .find((c) => c.props('testId') === testId);

const baseFormValues = (
  overrides: Partial<CreateEditEventFormValues> = {}
): CreateEditEventFormValues =>
  ({
    title: '',
    description: '',
    selectedTags: [],
    selectedChannels: [],
    address: '',
    latitude: 0,
    longitude: 0,
    locationName: '',
    isInPrivateResidence: false,
    virtualEventUrl: '',
    startTime: DateTime.now().plus({ hours: 1 }).toISO(),
    startTimeDayOfWeek: '',
    startTimeHourOfDay: 0,
    endTime: DateTime.now().plus({ hours: 2 }).toISO(),
    canceled: false,
    deleted: false,
    cost: '',
    free: false,
    isHostedByOP: false,
    isAllDay: false,
    occurrences: [],
    ...overrides,
  }) as CreateEditEventFormValues;

const mountFields = (overrides: Partial<CreateEditEventFormValues> = {}) =>
  shallowMount(EventScheduleFields, {
    props: { formValues: baseFormValues(overrides) },
  });

describe('EventScheduleFields', () => {
  it('renders a radio option for each date mode', () => {
    const wrapper = mountFields();
    expect(wrapper.find('[data-testid="date-mode-recurring"]').exists()).toBe(
      true
    );
  });

  it('renders the date-range mode option', () => {
    const wrapper = mountFields();
    expect(wrapper.find('[data-testid="date-mode-dateRange"]').exists()).toBe(
      true
    );
  });

  it('emits a date mode change when a different mode is selected', async () => {
    const wrapper = mountFields();
    await wrapper
      .get('[data-testid="date-mode-multiple"]')
      .find('input')
      .trigger('change');
    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { dateMode: 'multiple' },
    ]);
  });

  it('warns when the start time is in the past', () => {
    const wrapper = mountFields({
      startTime: DateTime.now().minus({ days: 1 }).toISO(),
    });
    expect(wrapper.findComponent(ErrorMessage).props('text')).toContain(
      'in the past'
    );
  });

  it('warns when the start time is not before the end time', () => {
    const wrapper = mountFields({
      startTime: DateTime.now().plus({ days: 2 }).toISO(),
      endTime: DateTime.now().plus({ days: 1 }).toISO(),
    });
    expect(wrapper.findComponent(ErrorMessage).props('text')).toBe(
      'The start time must be before the end time.'
    );
  });

  describe('date mode initialization', () => {
    it('seeds an occurrence when switching to multiple dates', async () => {
      const wrapper = mountFields({ occurrences: [] });
      await wrapper
        .get('[data-testid="date-mode-multiple"]')
        .find('input')
        .trigger('change');
      // First emit is the mode change; second seeds the occurrences array.
      expect(wrapper.emitted('updateFormValues')?.[1]?.[0]).toMatchObject({
        occurrences: [expect.objectContaining({ startTime: expect.any(String) })],
      });
    });

    it('seeds a repeat pattern when switching to recurring', async () => {
      const wrapper = mountFields({ repeatPattern: undefined });
      await wrapper
        .get('[data-testid="date-mode-recurring"]')
        .find('input')
        .trigger('change');
      expect(wrapper.emitted('updateFormValues')?.[1]?.[0]).toMatchObject({
        repeatPattern: expect.objectContaining({ type: 'WEEKLY' }),
      });
    });

    it('seeds a date-range group when switching to date-range mode', async () => {
      const wrapper = mountFields({ dateRangeGroups: [] });
      await wrapper
        .get('[data-testid="date-mode-dateRange"]')
        .find('input')
        .trigger('change');
      expect(wrapper.emitted('updateFormValues')?.[1]?.[0]).toMatchObject({
        dateRangeGroups: [
          expect.objectContaining({
            startDate: expect.any(String),
            startTimeOfDay: expect.any(String),
          }),
        ],
      });
    });
  });

  describe('single-mode date/time editing', () => {
    it('emits an updated start time when the time picker changes', async () => {
      const wrapper = mountFields();
      await wrapper
        .findComponent(DateTimePickersRow)
        .vm.$emit('update-start-time', '14:30');
      expect(emittedUpdate(wrapper)).toHaveProperty('startTime');
    });

    it('emits an updated end time when the time picker changes', async () => {
      const wrapper = mountFields();
      await wrapper
        .findComponent(DateTimePickersRow)
        .vm.$emit('update-end-time', '16:45');
      expect(emittedUpdate(wrapper)).toHaveProperty('endTime');
    });

    it('emits updates when the start date changes', async () => {
      const wrapper = mountFields();
      await wrapper
        .findComponent(DateTimePickersRow)
        .vm.$emit('update-start-date', '2030-01-15');
      expect(wrapper.emitted('updateFormValues')).toBeTruthy();
    });

    it('emits a new end time when the end date changes', async () => {
      const wrapper = mountFields();
      await wrapper
        .findComponent(DateTimePickersRow)
        .vm.$emit('update-end-date', '2030-02-20');
      expect(emittedUpdate(wrapper)).toHaveProperty('endTime');
    });
  });

  describe('all-day and multi-day toggles', () => {
    it('expands times to the full day when All day is checked', async () => {
      const wrapper = mountFields({ isAllDay: false });
      await checkbox(wrapper, 'all-day-input')!.vm.$emit('update');
      expect(emittedUpdate(wrapper, 0)).toMatchObject({ isAllDay: true });
      // Second emit sets the start/end to the day's bounds.
      expect(emittedUpdate(wrapper, 1)).toHaveProperty('startTime');
      expect(emittedUpdate(wrapper, 1)).toHaveProperty('endTime');
    });

    it('collapses the end date to the start date when multi-day is turned off', async () => {
      const wrapper = mountFields({
        startTime: DateTime.now().plus({ days: 1 }).toISO(),
        endTime: DateTime.now().plus({ days: 2 }).toISO(),
      });
      await checkbox(wrapper, 'multi-day-input')!.vm.$emit('update');
      expect(emittedUpdate(wrapper)).toHaveProperty('endTime');
    });
  });

  describe('multiple-dates mode', () => {
    const multi = () =>
      mountFields({
        dateMode: 'multiple',
        occurrences: [
          { startTime: baseStart(), endTime: baseEnd() },
        ],
      });
    const baseStart = () => DateTime.now().plus({ hours: 1 }).toISO() as string;
    const baseEnd = () => DateTime.now().plus({ hours: 2 }).toISO() as string;

    it('updates an occurrence at an index', async () => {
      const wrapper = multi();
      const next = { startTime: baseStart(), endTime: baseEnd() };
      await wrapper.findComponent(OccurrencesList).vm.$emit('update', 0, next);
      expect(emittedUpdate(wrapper)).toMatchObject({ occurrences: [next] });
    });

    it('appends an occurrence on add', async () => {
      const wrapper = multi();
      const added = { startTime: baseStart(), endTime: baseEnd() };
      await wrapper.findComponent(OccurrencesList).vm.$emit('add', added);
      expect((emittedUpdate(wrapper).occurrences as unknown[]).length).toBe(2);
    });

    it('drops an occurrence on remove', async () => {
      const wrapper = multi();
      await wrapper.findComponent(OccurrencesList).vm.$emit('remove', 0);
      expect(emittedUpdate(wrapper)).toMatchObject({ occurrences: [] });
    });
  });

  describe('recurring mode', () => {
    it('forwards a repeat-pattern update', async () => {
      const wrapper = mountFields({
        dateMode: 'recurring',
        repeatPattern: {
          type: 'WEEKLY',
          count: 1,
          daysOfWeek: [],
          endType: 'AFTER_COUNT',
          endCount: 5,
        },
      });
      const pattern = {
        type: 'MONTHLY',
        count: 2,
        daysOfWeek: [],
        endType: 'AFTER_COUNT',
        endCount: 3,
      };
      await wrapper.findComponent(RepeatPatternPicker).vm.$emit('update', pattern);
      expect(emittedUpdate(wrapper)).toMatchObject({ repeatPattern: pattern });
    });

    it('shows no occurrence preview for a MANUAL pattern', () => {
      const wrapper = mountFields({
        dateMode: 'recurring',
        repeatPattern: {
          type: 'MANUAL',
          count: 1,
          daysOfWeek: [],
          endType: 'AFTER_COUNT',
          endCount: 5,
        },
      });
      expect(wrapper.text()).not.toContain('Upcoming dates');
    });
  });
});
