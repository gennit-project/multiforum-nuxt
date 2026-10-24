import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import LibraryReorderControls from './LibraryReorderControls.vue';

describe('LibraryReorderControls', () => {
  it('disables moving the first item up', () => {
    const wrapper = mount(LibraryReorderControls, {
      props: { itemLabel: 'First saved', index: 0, total: 2 },
    });

    expect(
      wrapper
        .get('button[aria-label="Move First saved up"]')
        .attributes('disabled')
    ).toBeDefined();
  });

  it('emits the next position when moving down', async () => {
    const wrapper = mount(LibraryReorderControls, {
      props: { itemLabel: 'First saved', index: 0, total: 2 },
    });

    await wrapper
      .get('button[aria-label="Move First saved down"]')
      .trigger('click');

    expect(wrapper.emitted('move')).toEqual([[1]]);
  });
});
