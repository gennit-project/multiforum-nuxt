import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EventResultCount from './EventResultCount.vue';
import { LocationFilterTypes } from './filters/locationFilterTypes';

const mountCount = (locationFilter?: LocationFilterTypes, resultCount = 5) =>
  mount(EventResultCount, {
    props: { resultCount, filterValues: { locationFilter } },
  });

describe('EventResultCount', () => {
  it('renders the count for the virtual-only filter', () => {
    const wrapper = mountCount(LocationFilterTypes.ONLY_VIRTUAL);
    expect(wrapper.find('.inline-block').exists()).toBe(false);
  });

  it('renders the count for the no-location filter', () => {
    const wrapper = mountCount(LocationFilterTypes.NONE);
    expect(wrapper.find('.inline-block').exists()).toBe(false);
  });

  it('renders the count in the default branch for other filters', () => {
    const wrapper = mountCount(LocationFilterTypes.WITHIN_RADIUS);
    expect(wrapper.find('.inline-block').text()).toBe('5 results');
  });

  it('shows the result count text', () => {
    expect(mountCount(LocationFilterTypes.ONLY_VIRTUAL, 42).text()).toContain(
      '42 results'
    );
  });
});
