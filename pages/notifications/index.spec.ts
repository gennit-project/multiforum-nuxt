import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import NotificationsPage from './index.vue';
import NotificationTabs from '@/components/notifications/NotificationTabs.vue';

const NuxtLayoutStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

// Render only the authenticated slot so we can assert the tabs show for
// logged-in users.
const RequireAuthStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots['has-auth']?.());
  },
});

describe('notifications page', () => {
  it('shows the notification tabs to authenticated users', () => {
    const wrapper = shallowMount(NotificationsPage, {
      global: {
        stubs: { NuxtLayout: NuxtLayoutStub, RequireAuth: RequireAuthStub },
      },
    });
    expect(wrapper.findComponent(NotificationTabs).exists()).toBe(true);
  });
});
