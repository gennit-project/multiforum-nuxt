import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';

import RoleSection from '@/components/admin/RoleSection.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const permissionsListStub = defineComponent({
  name: 'PermissionsList',
  props: ['permissions'],
  template: '<div class="permissions-list-stub">{{ Object.keys(permissions).join(",") }}</div>',
});

const mountSection = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(RoleSection, {
    props: {
      roleTitle: 'Moderators',
      roleDescription: 'Can review content.',
      permissions: { canReviewReports: true },
      sectionTitle: 'Forum Roles',
      ...props,
    },
    global: {
      stubs: {
        PermissionsList: permissionsListStub,
      },
    },
  });

describe('RoleSection', () => {
  it('renders the section title when present', () => {
    const wrapper = mountSection();

    expect(wrapper.text()).toContain('Forum Roles');
  });

  it('hides the section heading when sectionTitle is blank', () => {
    const wrapper = mountSection({ sectionTitle: '' });

    expect(wrapper.find('h2').exists()).toBe(false);
  });

  it('renders the role title and description', () => {
    const wrapper = mountSection();

    expect(wrapper.text()).toContain('Moderators');
    expect(wrapper.text()).toContain('Can review content.');
  });

  it('passes the permissions object through to PermissionsList', () => {
    const wrapper = mountSection();

    expect(wrapper.getComponent(permissionsListStub).props('permissions')).toEqual({
      canReviewReports: true,
    });
  });
});
