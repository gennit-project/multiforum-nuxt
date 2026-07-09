import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import CreateIssuePage from './create.vue';
import CreateIssueForm from '@/components/mod/CreateIssueForm.vue';

describe('public server create issue page', () => {
  it('renders the create issue form', () => {
    const wrapper = shallowMount(CreateIssuePage);
    expect(wrapper.findComponent(CreateIssueForm).exists()).toBe(true);
  });

  it('keeps the user in the public tree after creating an issue', () => {
    const wrapper = shallowMount(CreateIssuePage);
    expect(
      wrapper.findComponent(CreateIssueForm).props('serverDetailRouteName')
    ).toBe('server-issues-issueNumber');
  });
});
