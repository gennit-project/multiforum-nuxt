import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import CheckBox from '@/components/CheckBox.vue';

const mountBox = (props: Record<string, unknown> = {}) => mount(CheckBox, { props });

describe('CheckBox', () => {
  it('reflects the checked prop', () => {
    const wrapper = mountBox({ checked: true });

    expect((wrapper.get('input').element as HTMLInputElement).checked).toBe(true);
  });

  it('emits update with the new checked state', async () => {
    const wrapper = mountBox();

    await wrapper.get('input').setValue(true);

    expect(wrapper.emitted('update')?.[0]).toEqual([true]);
  });

  it('renders a label when provided', () => {
    const wrapper = mountBox({ label: 'Accept' });

    expect(wrapper.find('label').text()).toBe('Accept');
  });

  it('omits the label element when there is no label', () => {
    const wrapper = mountBox();

    expect(wrapper.find('label').exists()).toBe(false);
  });

  it('disables the input', () => {
    const wrapper = mountBox({ disabled: true });

    expect(wrapper.get('input').attributes('disabled')).toBeDefined();
  });

  it('uses an explicit id', () => {
    const wrapper = mountBox({ id: 'agree', label: 'Agree' });

    expect(wrapper.get('input').attributes('id')).toBe('agree');
  });

  it('derives the id from the test id', () => {
    const wrapper = mountBox({ testId: 'agree' });

    expect(wrapper.get('input').attributes('id')).toBe('checkbox-agree');
  });

  it('uses the aria-label when there is no visible label', () => {
    const wrapper = mountBox({ ariaLabel: 'Agree to terms' });

    expect(wrapper.get('input').attributes('aria-label')).toBe('Agree to terms');
  });
});
