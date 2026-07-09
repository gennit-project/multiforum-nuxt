import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import IssuesLayout from './issues.vue';
import ServerIssueTabNav from '@/components/mod/ServerIssueTabNav.vue';

// The count/tab behavior lives in ServerIssueTabNav (see its spec); this layout
// page is a thin wrapper that wires it to the admin route names.
describe('admin issues layout page', () => {
  it('renders the shared issue tab nav', () => {
    const wrapper = shallowMount(IssuesLayout, {
      global: { stubs: { NuxtPage: true } },
    });
    expect(wrapper.findComponent(ServerIssueTabNav).exists()).toBe(true);
  });

  it('wires the tab nav to the admin open-issue route', () => {
    const wrapper = shallowMount(IssuesLayout, {
      global: { stubs: { NuxtPage: true } },
    });
    expect(
      wrapper.findComponent(ServerIssueTabNav).props('openRouteName')
    ).toBe('admin-issues');
  });

  it('wires the tab nav to the admin create-issue route', () => {
    const wrapper = shallowMount(IssuesLayout, {
      global: { stubs: { NuxtPage: true } },
    });
    expect(
      wrapper.findComponent(ServerIssueTabNav).props('createRouteName')
    ).toBe('admin-issues-create');
  });
});
