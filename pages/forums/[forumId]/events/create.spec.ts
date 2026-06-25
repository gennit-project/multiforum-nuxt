import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import CreateEventPage from './create.vue';
import CreateEvent from '@/components/event/form/CreateEvent.vue';

describe('forum create event page', () => {
  it('renders the create event form', () => {
    const wrapper = shallowMount(CreateEventPage);
    expect(wrapper.findComponent(CreateEvent).exists()).toBe(true);
  });
});
