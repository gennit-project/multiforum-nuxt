import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import SuspendedModsPage from './suspended-mods.vue';
import ServerSuspendedModList from '@/components/admin/ServerSuspendedModList.vue';

const FormRowStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.content?.() ?? slots.default?.());
  },
});

describe('admin suspended mods page', () => {
  it('renders the server-suspended mod list', () => {
    const wrapper = shallowMount(SuspendedModsPage, {
      global: { stubs: { FormRow: FormRowStub } },
    });
    expect(wrapper.findComponent(ServerSuspendedModList).exists()).toBe(true);
  });
});
