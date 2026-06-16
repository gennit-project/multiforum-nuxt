import { describe, it, expect, vi } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createSSRAuthMock } from '@/tests/utils/mockSSRAuth';

vi.mock('@/composables/useSSRAuth', () => createSSRAuthMock());

// The global setup only mocks the Tab family of @headlessui/vue; provide the
// Menu family here, rendering their contents inline so the items are present.
vi.mock('@headlessui/vue', () => ({
  Menu: { template: '<div><slot /></div>' },
  MenuButton: { template: '<button><slot /></button>' },
  MenuItems: { template: '<div><slot /></div>' },
  MenuItem: { template: '<div><slot :active="false" /></div>' },
}));

import EventNotificationsMenu from '@/components/event/detail/EventNotificationsMenu.vue';

const mountMenu = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(EventNotificationsMenu, {
    props: { watchComments: false, watchUpdates: false, ...props },
    global: { stubs: { LoadingSpinner: true, ChevronDownIcon: true } },
  });

const itemButton = (
  wrapper: ReturnType<typeof mountMenu>,
  label: string
) => wrapper.findAll('button').find((b) => b.text().includes(label))!;

describe('EventNotificationsMenu', () => {
  it('emits toggleComments when the comments item is clicked', async () => {
    const wrapper = mountMenu();
    await itemButton(wrapper, 'Comments and replies').trigger('click');
    expect(wrapper.emitted('toggleComments')).toHaveLength(1);
  });

  it('emits toggleUpdates when the updates item is clicked', async () => {
    const wrapper = mountMenu();
    await itemButton(wrapper, 'Event updates').trigger('click');
    expect(wrapper.emitted('toggleUpdates')).toHaveLength(1);
  });

  it('reflects the watchComments state on its checkbox', () => {
    const wrapper = mountMenu({ watchComments: true });
    const checkbox = wrapper.find('input[type="checkbox"]');
    expect((checkbox.element as HTMLInputElement).checked).toBe(true);
  });
});
