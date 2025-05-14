import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DateTimePickersRow from '@/components/event/form/DateTimePickersRow.vue';
import DatePicker from '@/components/event/form/DatePicker.vue';
import TimePicker from '@/components/event/form/TimePicker.vue';

// Mock the click-outside directive since it's used in TimePicker
const mockDirective = {
  mounted: () => {},
  unmounted: () => {}
};

describe('DateTimePickersRow', () => {
  // Create default props that all tests will use as a base
  const defaultProps = {
    isAllDay: false,
    isMultiDay: false,
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000) // 1 hour later
  };

  it('shows start date, start time, and end time pickers by default (single-day, not all-day)', async () => {
    const wrapper = mount(DateTimePickersRow, {
      props: defaultProps,
      global: {
        directives: {
          'click-outside': mockDirective
        },
        stubs: {
          DatePicker: true,
          TimePicker: true
        }
      }
    });

    // Find all date and time pickers
    const datePickers = wrapper.findAllComponents(DatePicker);
    const timePickers = wrapper.findAllComponents(TimePicker);
    
    // Default state should have one date picker (start date) and two time pickers (start and end time)
    expect(datePickers.length).toBe(1);
    expect(timePickers.length).toBe(2);
    
    // End Time label should be visible
    const endTimeLabel = wrapper.find('[data-testid="end-time-label"]');
    expect(endTimeLabel.exists()).toBe(true);
  });

  it('shows only start date picker for all-day events (single-day)', async () => {
    const wrapper = mount(DateTimePickersRow, {
      props: {
        ...defaultProps,
        isAllDay: true,
      },
      global: {
        directives: {
          'click-outside': mockDirective
        },
        stubs: {
          DatePicker: true,
          TimePicker: true
        }
      }
    });

    // Find all date and time pickers
    const datePickers = wrapper.findAllComponents(DatePicker);
    const timePickers = wrapper.findAllComponents(TimePicker);
    
    // Should have one date picker (start date) and no time pickers
    expect(datePickers.length).toBe(1);
    expect(timePickers.length).toBe(0);
    
    // End Time label should not be visible
    const endTimeLabel = wrapper.find('[data-testid="end-time-label"]');
    expect(endTimeLabel.exists()).toBe(false);
  });

  it('shows both date pickers but no time pickers for all-day multi-day events', async () => {
    const wrapper = mount(DateTimePickersRow, {
      props: {
        ...defaultProps,
        isAllDay: true,
        isMultiDay: true,
      },
      global: {
        directives: {
          'click-outside': mockDirective
        },
        stubs: {
          DatePicker: true,
          TimePicker: true
        }
      }
    });

    // Find all date and time pickers
    const datePickers = wrapper.findAllComponents(DatePicker);
    const timePickers = wrapper.findAllComponents(TimePicker);
    
    // Should have two date pickers (start and end) and no time pickers
    expect(datePickers.length).toBe(2);
    expect(timePickers.length).toBe(0);
    
    // End Time label should not be visible
    const endTimeLabel = wrapper.find('[data-testid="end-time-label"]');
    expect(endTimeLabel.exists()).toBe(false);
  });

  it('shows all pickers for multi-day events that are not all-day', async () => {
    const wrapper = mount(DateTimePickersRow, {
      props: {
        ...defaultProps,
        isMultiDay: true,
      },
      global: {
        directives: {
          'click-outside': mockDirective
        },
        stubs: {
          DatePicker: true,
          TimePicker: true
        }
      }
    });

    // Find all date and time pickers
    const datePickers = wrapper.findAllComponents(DatePicker);
    const timePickers = wrapper.findAllComponents(TimePicker);
    
    // Should have two date pickers (start and end) and two time pickers (start and end)
    expect(datePickers.length).toBe(2);
    expect(timePickers.length).toBe(2);
    
    // End Time label should be visible
    const endTimeLabel = wrapper.find('[data-testid="end-time-label"]');
    expect(endTimeLabel.exists()).toBe(true);
  });

  it('emits update events when date and time changes', async () => {
    const wrapper = mount(DateTimePickersRow, {
      props: defaultProps,
      global: {
        directives: {
          'click-outside': mockDirective
        },
        stubs: {
          DatePicker: false,
          TimePicker: false
        }
      }
    });

    // Mock a date picker input change
    const startDatePicker = wrapper.findComponent('[data-testid="start-date-picker"]');
    await startDatePicker.vm.$emit('update', '2023-01-01');
    
    // Verify the event was emitted with the correct value
    expect(wrapper.emitted('updateStartDate')).toBeTruthy();
    expect(wrapper.emitted('updateStartDate')[0]).toEqual(['2023-01-01']);
    
    // Mock a time picker input change
    const startTimePicker = wrapper.findComponent('[data-testid="start-time-picker"]');
    await startTimePicker.vm.$emit('update', '14:30');
    
    // Verify the event was emitted with the correct value
    expect(wrapper.emitted('updateStartTime')).toBeTruthy();
    expect(wrapper.emitted('updateStartTime')[0]).toEqual(['14:30']);
  });
});