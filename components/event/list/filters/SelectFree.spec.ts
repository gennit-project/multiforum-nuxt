import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SelectFree from '@/components/event/list/filters/SelectFree.vue';

describe('SelectFree', () => {
  it('toggles free-only event visibility from the initial value', async () => {
    const wrapper = mount(SelectFree, {
      props: { showOnlyFree: true },
    });

    await wrapper.get('[data-testid="free-checkbox"]').trigger('input');

    expect(wrapper.emitted('updateShowOnlyFree')).toEqual([[false]]);
  });
});
