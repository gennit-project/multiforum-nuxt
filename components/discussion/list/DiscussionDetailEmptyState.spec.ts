import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DiscussionDetailEmptyState from './DiscussionDetailEmptyState.vue';

describe('DiscussionDetailEmptyState', () => {
  it('shows the default prompt message', () => {
    expect(mount(DiscussionDetailEmptyState).text()).toContain(
      'Select a discussion to view details.'
    );
  });

  it('shows a custom message when provided', () => {
    const wrapper = mount(DiscussionDetailEmptyState, {
      props: { message: 'Nothing selected yet' },
    });
    expect(wrapper.text()).toContain('Nothing selected yet');
  });
});
