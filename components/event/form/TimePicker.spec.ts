import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import TimePicker from './TimePicker.vue';

const mountPicker = (props: Record<string, unknown> = {}) =>
  mount(TimePicker, { props: { value: '09:00', ...props } });

const trigger = (wrapper: ReturnType<typeof mountPicker>) =>
  wrapper.get('[data-testid="time-picker"]');

const option = (wrapper: ReturnType<typeof mountPicker>, label: string) =>
  wrapper.findAll('.cursor-pointer').find((d) => d.text() === label);

describe('TimePicker', () => {
  it('renders the value in 12-hour format', () => {
    expect(mountPicker({ value: '14:30' }).text()).toContain('2:30 PM');
  });

  it('falls back to the raw value for an invalid time', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(mountPicker({ value: 'not-a-time' }).text()).toContain('not-a-time');
  });

  it('opens the dropdown when clicked', async () => {
    const wrapper = mountPicker();
    expect(option(wrapper, '12:15 AM')).toBeUndefined();
    await trigger(wrapper).trigger('click');
    expect(option(wrapper, '12:15 AM')).toBeTruthy();
  });

  it('emits the 24-hour value when a time is selected', async () => {
    const wrapper = mountPicker();
    await trigger(wrapper).trigger('click');
    await option(wrapper, '12:15 AM')!.trigger('click');
    expect(wrapper.emitted('update')?.at(-1)).toEqual(['00:15']);
  });

  it('closes the dropdown after selecting a time', async () => {
    const wrapper = mountPicker();
    await trigger(wrapper).trigger('click');
    await option(wrapper, '12:15 AM')!.trigger('click');
    expect(option(wrapper, '12:15 AM')).toBeUndefined();
  });

  it('does not open when disabled', async () => {
    const wrapper = mountPicker({ disabled: true });
    await trigger(wrapper).trigger('click');
    expect(option(wrapper, '12:15 AM')).toBeUndefined();
  });
});
