import { describe, expect, it } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import SuspendedModsPage from './suspended-mods.vue';
import SuspendedUsersPage from './suspended-users.vue';

const FormRow = {
  template: '<section><slot name="content" /></section>',
};

describe('server suspension list pages', () => {
  it('explains and renders the server-suspended moderator list', () => {
    const wrapper = shallowMount(SuspendedModsPage, {
      global: { stubs: { FormRow } },
    });

    expect({
      heading: wrapper.text().includes('Server-Suspended Mods'),
      guidance: wrapper.text().includes('open the related issue'),
      list: wrapper.findComponent({ name: 'ServerSuspendedModList' }).exists(),
    }).toEqual({ heading: true, guidance: true, list: true });
  });

  it('explains and renders the server-suspended user list', () => {
    const wrapper = shallowMount(SuspendedUsersPage, {
      global: { stubs: { FormRow } },
    });

    expect({
      heading: wrapper.text().includes('Server-Suspended Users'),
      guidance: wrapper.text().includes('open the related issue'),
      list: wrapper.findComponent({ name: 'ServerSuspendedUserList' }).exists(),
    }).toEqual({ heading: true, guidance: true, list: true });
  });
});
