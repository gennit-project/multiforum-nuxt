import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import RadioButtons from '@/components/RadioButtons.vue';

const options = [
  { label: 'Small', value: 'small' },
  { label: 'Large', value: 'large' },
];

const mountRadios = (props: Record<string, unknown> = {}) =>
  mount(RadioButtons, {
    props: { selectedOption: options[0], options, ...props },
  });

describe('RadioButtons', () => {
  it('checks the selected option and emits the clicked option', async () => {
    const wrapper = mountRadios();
    const radios = wrapper.findAll('input[type="radio"]');

    await radios[1]!.trigger('input');

    expect({
      checked: (radios[0]!.element as HTMLInputElement).checked,
      emitted: wrapper.emitted('updateSelected'),
    }).toEqual({
      checked: true,
      emitted: [[options[1]]],
    });
  });

  it('renders the legend as the accessible group name', () => {
    const wrapper = mountRadios({ legend: 'Font Size' });

    expect(wrapper.get('legend').text()).toBe('Font Size');
  });

  it('gives every radio in the group the same name', () => {
    const wrapper = mountRadios();
    const names = wrapper
      .findAll('input[type="radio"]')
      .map((r) => r.attributes('name'));

    expect(new Set(names).size).toBe(1);
  });

  it('omits the legend when none is provided', () => {
    const wrapper = mountRadios();

    expect(wrapper.find('legend').exists()).toBe(false);
  });
});
