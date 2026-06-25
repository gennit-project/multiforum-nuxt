import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import AcceptInvitePage from './accept-invite.vue';
import PendingInvite from '@/components/mod/PendingInvite.vue';

const SlotStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

const RequireAuthStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots['has-auth']?.());
  },
});

describe('forum accept invite page', () => {
  it('shows the pending invite to authenticated users', () => {
    const wrapper = shallowMount(AcceptInvitePage, {
      global: {
        stubs: { ClientOnly: SlotStub, RequireAuth: RequireAuthStub },
      },
    });
    expect(wrapper.findComponent(PendingInvite).exists()).toBe(true);
  });
});
