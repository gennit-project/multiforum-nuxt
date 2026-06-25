import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { DateTime } from 'luxon';
import EventScheduleFields from './EventScheduleFields.vue';
import ErrorMessage from '@/components/ErrorMessage.vue';
import type { CreateEditEventFormValues } from '@/types/Event';

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
});
