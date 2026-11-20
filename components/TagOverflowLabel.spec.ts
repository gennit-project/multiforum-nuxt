import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TagOverflowLabel from '@/components/TagOverflowLabel.vue';

describe('TagOverflowLabel', () => {
  it('reads "... and x others"', () => {
    const wrapper = mount(TagOverflowLabel, { props: { count: 3 } });

    expect(wrapper.text()).toBe('... and 3 others');
  });

  it('renders nothing when no tags are hidden', () => {
    const wrapper = mount(TagOverflowLabel, { props: { count: 0 } });

    expect(wrapper.find('[data-testid="tag-overflow-label"]').exists()).toBe(
      false
    );
  });
});
