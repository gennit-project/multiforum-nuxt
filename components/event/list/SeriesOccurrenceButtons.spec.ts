import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import SeriesOccurrenceButtons from '@/components/event/list/SeriesOccurrenceButtons.vue';

const FUTURE = (month: number) => `2099-0${month}-15T18:00:00.000Z`;
const PAST = '2000-01-01T18:00:00.000Z';

const mountButtons = (props: Record<string, unknown> = {}) =>
  mount(SeriesOccurrenceButtons, {
    props: {
      occurrences: [
        { id: 'e2', startTime: FUTURE(2) },
        { id: 'e3', startTime: FUTURE(3) },
      ],
      currentEventId: 'e1',
      channelUniqueName: 'cats',
      ...props,
    },
    global: {
      stubs: {
        NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a :href="to"><slot /></a>' },
      },
    },
  });

describe('SeriesOccurrenceButtons', () => {
  it('shows the "Also on" label with upcoming occurrences', () => {
    const wrapper = mountButtons();

    expect(wrapper.text()).toContain('Also on:');
  });

  it('renders a link per upcoming occurrence', () => {
    const wrapper = mountButtons();

    expect(wrapper.findAll('a')).toHaveLength(2);
  });

  it('links to each occurrence', () => {
    const wrapper = mountButtons();

    expect(wrapper.find('a').attributes('href')).toBe('/forums/cats/events/e2');
  });

  it('filters out past occurrences', () => {
    const wrapper = mountButtons({
      occurrences: [
        { id: 'e2', startTime: FUTURE(2) },
        { id: 'old', startTime: PAST },
      ],
    });

    expect(wrapper.findAll('a')).toHaveLength(1);
  });

  it('filters out the current event', () => {
    const wrapper = mountButtons({
      occurrences: [
        { id: 'e1', startTime: FUTURE(2) },
        { id: 'e2', startTime: FUTURE(3) },
      ],
    });

    expect(wrapper.findAll('a')).toHaveLength(1);
  });

  it('renders nothing when there are no upcoming occurrences', () => {
    const wrapper = mountButtons({ occurrences: [{ id: 'old', startTime: PAST }] });

    expect(wrapper.text()).toBe('');
  });

  it('limits visible occurrences and shows a +more count', () => {
    const wrapper = mountButtons({
      maxVisible: 2,
      occurrences: [
        { id: 'e2', startTime: FUTURE(2) },
        { id: 'e3', startTime: FUTURE(3) },
        { id: 'e4', startTime: FUTURE(4) },
        { id: 'e5', startTime: FUTURE(5) },
      ],
    });

    expect(wrapper.text()).toContain('+2 more');
  });
});
