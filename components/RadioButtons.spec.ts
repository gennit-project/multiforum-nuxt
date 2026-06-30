import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import RadioButtons from '@/components/RadioButtons.vue';

describe('RadioButtons', () => {
  it('checks the selected option and emits the clicked option', async () => {
    const options = [
      { label: 'Small', value: 'small' },
      { label: 'Large', value: 'large' },
    ];
    const wrapper = mount(RadioButtons, {
      props: {
        selectedOption: options[0],
        options,
      },
    });

    await wrapper.get('#radio-large').trigger('input');

    expect({
      checked: (wrapper.get('#radio-small').element as HTMLInputElement).checked,
      emitted: wrapper.emitted('updateSelected'),
    }).toEqual({
      checked: true,
      emitted: [[options[1]]],
    });
  });
});
