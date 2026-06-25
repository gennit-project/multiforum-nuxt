import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import CreateDiscussionPage from './create.vue';
import CreateDiscussion from '@/components/discussion/form/CreateDiscussion.vue';

describe('forum create discussion page', () => {
  it('renders the create discussion form', () => {
    const wrapper = shallowMount(CreateDiscussionPage);
    expect(wrapper.findComponent(CreateDiscussion).exists()).toBe(true);
  });
});
