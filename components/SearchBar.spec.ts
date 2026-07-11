import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import SearchBar from '@/components/SearchBar.vue';

const input = (wrapper: ReturnType<typeof mount>) => wrapper.get('input');

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('emits sanitized input immediately when debounce is disabled', async () => {
    const wrapper = mount(SearchBar, {
      props: { debounceMs: 0, initialValue: '', testId: 'search' },
      global: { stubs: { SearchIcon: true } },
    });

    await input(wrapper).setValue(`"quoted' search"`);

    expect(wrapper.emitted('updateSearchInput')).toEqual([[`quoted search`]]);
  });

  it('debounces sanitized input by default', async () => {
    vi.useFakeTimers();
    const wrapper = mount(SearchBar, {
      props: { initialValue: '', testId: 'search', debounceMs: 250 },
      global: { stubs: { SearchIcon: true } },
    });

    await input(wrapper).setValue('first');
    await input(wrapper).setValue('second');
    vi.advanceTimersByTime(249);

    expect(wrapper.emitted('updateSearchInput')).toBeUndefined();

    vi.advanceTimersByTime(1);

    expect(wrapper.emitted('updateSearchInput')).toEqual([[`second`]]);
  });

  it('submits sanitized input on enter', async () => {
    const wrapper = mount(SearchBar, {
      props: { debounceMs: 0, initialValue: '', testId: 'search' },
      global: { stubs: { SearchIcon: true } },
    });

    await input(wrapper).setValue(`find "this"`);
    await input(wrapper).trigger('keydown.enter');

    expect(wrapper.emitted('submit')).toEqual([[`find this`]]);
  });

  it('clears the input and emits an empty search value', async () => {
    const wrapper = mount(SearchBar, {
      props: { initialValue: 'existing', testId: 'search' },
      global: { stubs: { SearchIcon: true } },
    });

    await wrapper.get('button[aria-label="Clear search"]').trigger('click');
    await nextTick();

    expect({
      emitted: wrapper.emitted('updateSearchInput'),
      value: input(wrapper).element.value,
    }).toEqual({
      emitted: [['']],
      value: '',
    });
  });

  it('associates the visually-hidden label with the input', () => {
    const wrapper = mount(SearchBar, {
      props: { autoFocus: false, initialValue: '', testId: 'search' },
      global: { stubs: { SearchIcon: true } },
    });

    expect(wrapper.get('label').attributes('for')).toBe(
      input(wrapper).attributes('id')
    );
  });

  it('gives the input a non-empty id for the label association', () => {
    const wrapper = mount(SearchBar, {
      props: { autoFocus: false, initialValue: '', testId: 'search' },
      global: { stubs: { SearchIcon: true } },
    });

    expect(input(wrapper).attributes('id')).toBeTruthy();
  });

  it('exposes focus and getValue helpers', async () => {
    const wrapper = mount(SearchBar, {
      props: { autoFocus: false, initialValue: 'needle', testId: 'search' },
      attachTo: document.body,
      global: { stubs: { SearchIcon: true } },
    });

    wrapper.vm.focus();
    await nextTick();

    expect({
      active: document.activeElement,
      value: wrapper.vm.getValue(),
    }).toEqual({
      active: input(wrapper).element,
      value: 'needle',
    });
  });
});
