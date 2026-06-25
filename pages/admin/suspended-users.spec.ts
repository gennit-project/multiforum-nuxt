import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import SuspendedUsersPage from './suspended-users.vue';
import ServerSuspendedUserList from '@/components/admin/ServerSuspendedUserList.vue';

const FormRowStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.content?.() ?? slots.default?.());
  },
});

describe('admin suspended users page', () => {
  it('renders the server-suspended user list', () => {
    const wrapper = shallowMount(SuspendedUsersPage, {
      global: { stubs: { FormRow: FormRowStub } },
    });
    expect(wrapper.findComponent(ServerSuspendedUserList).exists()).toBe(true);
  });
});
