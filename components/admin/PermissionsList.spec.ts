import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import PermissionsList from '@/components/admin/PermissionsList.vue';

const stubs = {
  CheckIcon: { template: '<i class="check-icon" />' },
  XmarkIcon: { template: '<i class="xmark-icon" />' },
};

const mountList = (permissions: Record<string, unknown>) =>
  mountWithDefaults(PermissionsList, {
    props: { permissions },
    global: { stubs },
  });

describe('PermissionsList', () => {
  it('formats camelCase permission names into spaced words', () => {
    const wrapper = mountList({ canCreateChannel: true });
    expect(wrapper.text()).toContain('can create channel');
  });

  it('renders a check icon for a granted permission', () => {
    const wrapper = mountList({ canCreateChannel: true });
    expect(wrapper.find('.check-icon').exists()).toBe(true);
  });

  it('renders an xmark icon for a denied permission', () => {
    const wrapper = mountList({ canCreateChannel: false });
    expect(wrapper.find('.xmark-icon').exists()).toBe(true);
  });

  it('hides the metadata keys (name, description, __typename)', () => {
    const wrapper = mountList({ name: 'Role', canDoThing: true });
    expect(wrapper.findAll('.flex.items-center.hidden')).toHaveLength(1);
  });
});
