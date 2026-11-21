import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PageSkeleton from './PageSkeleton.vue';

describe('PageSkeleton', () => {
  it('labels the status region', () => {
    const wrapper = mount(PageSkeleton, { props: { label: 'Loading wiki' } });
    expect(wrapper.get('[role="status"]').attributes('aria-label')).toBe(
      'Loading wiki'
    );
  });

  it('renders a title bar plus the requested number of lines', () => {
    const wrapper = mount(PageSkeleton, { props: { lines: 2 } });
    expect(wrapper.get('.animate-pulse').element.children).toHaveLength(3);
  });
});
