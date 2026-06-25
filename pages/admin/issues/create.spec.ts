import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import CreateIssuePage from './create.vue';
import CreateIssueForm from '@/components/mod/CreateIssueForm.vue';

describe('admin create issue page', () => {
  it('renders the create issue form', () => {
    const wrapper = shallowMount(CreateIssuePage);
    expect(wrapper.findComponent(CreateIssueForm).exists()).toBe(true);
  });
});
