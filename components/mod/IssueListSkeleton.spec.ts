import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import IssueListSkeleton from './IssueListSkeleton.vue';

describe('IssueListSkeleton', () => {
  it('renders the requested number of placeholder rows plus the sr-only label', () => {
    const wrapper = mount(IssueListSkeleton, { props: { count: 3 } });
    expect(wrapper.findAll('li[aria-hidden="true"]')).toHaveLength(3);
  });

  it('announces itself as a status region', () => {
    const wrapper = mount(IssueListSkeleton, {
      props: { label: 'Loading issues' },
    });
    expect(wrapper.get('[role="status"]').attributes('aria-label')).toBe(
      'Loading issues'
    );
  });
});
