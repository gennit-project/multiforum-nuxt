import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import IssueDetailPage from './[issueNumber].vue';
import IssueDetail from '@/components/mod/IssueDetail.vue';

describe('forum issue detail page', () => {
  it('renders the issue detail component', () => {
    const wrapper = shallowMount(IssueDetailPage);
    expect(wrapper.findComponent(IssueDetail).exists()).toBe(true);
  });
});
