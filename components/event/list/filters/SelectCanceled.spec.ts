import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SelectCanceled from '@/components/event/list/filters/SelectCanceled.vue';

describe('SelectCanceled', () => {
  it('toggles canceled event visibility from the initial value', async () => {
    const wrapper = mount(SelectCanceled, {
      props: { showCanceled: false },
    });

    await wrapper.get('[data-testid="canceled-checkbox"]').trigger('input');

    expect(wrapper.emitted('updateShowCanceled')).toEqual([[true]]);
  });
});
