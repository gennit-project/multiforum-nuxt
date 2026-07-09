import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import IndexPage from './index.vue';
import ServerIssueList from '@/components/mod/ServerIssueList.vue';

// Public transparency list; behavior lives in ServerIssueList.spec.ts.
describe('public server issues index page', () => {
  it('renders the list in the open configuration', () => {
    const wrapper = shallowMount(IndexPage);
    expect(wrapper.findComponent(ServerIssueList).props('isOpen')).toBe(true);
  });
});
