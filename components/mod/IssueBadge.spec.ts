import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import type { Issue } from '@/__generated__/graphql';

import IssueBadge from '@/components/mod/IssueBadge.vue';

const mountBadge = (isOpen: boolean) =>
  mountWithDefaults(IssueBadge, {
    props: { issue: { isOpen } as Issue },
  });

describe('IssueBadge', () => {
  it('shows the Open label for an open issue', () => {
    const wrapper = mountBadge(true);
    expect(wrapper.text()).toContain('Open');
  });

  it('shows the Closed label for a closed issue', () => {
    const wrapper = mountBadge(false);
    expect(wrapper.text()).toContain('Closed');
  });

  it('applies the green background for an open issue', () => {
    const wrapper = mountBadge(true);
    expect(wrapper.get('div').classes()).toContain('bg-green-500');
  });

  it('applies the purple background for a closed issue', () => {
    const wrapper = mountBadge(false);
    expect(wrapper.get('div').classes()).toContain('bg-purple-500');
  });
});
