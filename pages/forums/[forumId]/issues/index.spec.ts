import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import IssuesIndexPage from './index.vue';
import IssueList from '@/components/mod/IssueList.vue';

describe('forum issues index page', () => {
  it('renders the issue list', () => {
    const wrapper = shallowMount(IssuesIndexPage);
    expect(wrapper.findComponent(IssueList).exists()).toBe(true);
  });
});
