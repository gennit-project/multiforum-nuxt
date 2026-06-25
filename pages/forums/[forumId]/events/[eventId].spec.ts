import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import EventDetailPage from './[eventId].vue';
import EventDetail from '@/components/event/detail/EventDetail.vue';

describe('forum event detail page', () => {
  it('renders the event detail component', () => {
    const wrapper = shallowMount(EventDetailPage);
    expect(wrapper.findComponent(EventDetail).exists()).toBe(true);
  });
});
