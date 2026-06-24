import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import TextInput from '@/components/TextInput.vue';

const mountInput = (props: Record<string, unknown> = {}) =>
  mount(TextInput, {
    props,
    global: { stubs: { ExclamationTriangleIcon: true } },
  });

describe('TextInput mode', () => {
  it('renders a single-line input by default', () => {
    const wrapper = mountInput();

    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('renders a textarea for multiple rows', () => {
    const wrapper = mountInput({ rows: 3 });

    expect(wrapper.find('textarea').exists()).toBe(true);
  });
});

describe('TextInput value', () => {
  it('shows the initial value', () => {
    const wrapper = mountInput({ value: 'hello' });

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('hello');
  });

  it('emits update on input', async () => {
    const wrapper = mountInput();

    await wrapper.find('input').setValue('typed');

    expect(wrapper.emitted('update')?.[0]).toEqual(['typed']);
  });

  it('syncs the input when the value prop changes', async () => {
    const wrapper = mountInput({ value: 'a' });

    await wrapper.setProps({ value: 'b' });

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('b');
  });
});

describe('TextInput labelling', () => {
  it('renders a label when provided', () => {
    const wrapper = mountInput({ label: 'Your name' });

    expect(wrapper.find('label').text()).toBe('Your name');
  });

  it('uses the aria-label from the placeholder when there is no label', () => {
    const wrapper = mountInput({ placeholder: 'Search' });

    expect(wrapper.find('input').attributes('aria-label')).toBe('Search');
  });

  it('derives the input id from the testId', () => {
    const wrapper = mountInput({ testId: 'name-input' });

    expect(wrapper.find('input').attributes('id')).toBe('input-name-input');
  });

  it('uses an explicit id when provided', () => {
    const wrapper = mountInput({ id: 'custom-id' });

    expect(wrapper.find('input').attributes('id')).toBe('custom-id');
  });
});

describe('TextInput validation', () => {
  it('shows an error message', () => {
    const wrapper = mountInput({ errorMessage: 'Required' });

    expect(wrapper.find('[role="alert"]').text()).toBe('Required');
  });

  it('marks the input invalid', () => {
    const wrapper = mountInput({ invalid: true });

    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true');
  });

  it('disables the input', () => {
    const wrapper = mountInput({ disabled: true });

    expect(wrapper.find('input').attributes('disabled')).toBeDefined();
  });
});

describe('TextInput focus', () => {
  it('focuses the input via the exposed focus method', () => {
    const wrapper = mountInput();
    const input = wrapper.find('input').element as HTMLInputElement;
    const spy = vi.spyOn(input, 'focus');

    (wrapper.vm as unknown as { focus: () => void }).focus();

    expect(spy).toHaveBeenCalled();
  });
});
