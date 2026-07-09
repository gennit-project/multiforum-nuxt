import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import ClosedPage from './closed.vue';
import ServerIssueList from '@/components/mod/ServerIssueList.vue';

// Public transparency list; behavior lives in ServerIssueList.spec.ts.
describe('public server closed issues page', () => {
  it('renders the list in the closed configuration', () => {
    const wrapper = shallowMount(ClosedPage);
    expect(wrapper.findComponent(ServerIssueList).props('isOpen')).toBe(false);
  });

  it('passes the closed-issue search placeholder', () => {
    const wrapper = shallowMount(ClosedPage);
    expect(
      wrapper.findComponent(ServerIssueList).props('searchPlaceholder')
    ).toBe('Search closed issues');
  });
});
