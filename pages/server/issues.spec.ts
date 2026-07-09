import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import ServerIssueTabNav from '@/components/mod/ServerIssueTabNav.vue';
import ServerIssueSplitView from '@/components/mod/ServerIssueSplitView.vue';

const routeRef: { name: string } = { name: 'server-issues' };

vi.mock('nuxt/app', () => ({
  useRoute: () => routeRef,
}));

const NuxtLayoutStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

const mountPage = async () => {
  const Page = (await import('./issues.vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        NuxtLayout: NuxtLayoutStub,
        NuxtPage: true,
        ServerIssueSplitView: {
          name: 'ServerIssueSplitView',
          props: ['showDetailPane'],
          template: '<div><slot /></div>',
        },
      },
    },
  });
};

beforeEach(() => {
  routeRef.name = 'server-issues';
});

describe('public server issues layout page', () => {
  it('wires the tab nav to the public open-issue route', async () => {
    const wrapper = await mountPage();
    expect(
      wrapper.findComponent(ServerIssueTabNav).props('openRouteName')
    ).toBe('server-issues');
  });

  it('wires the tab nav to the public create-issue route', async () => {
    const wrapper = await mountPage();
    expect(
      wrapper.findComponent(ServerIssueTabNav).props('createRouteName')
    ).toBe('server-issues-create');
  });

  it('enables the detail pane on the open-issues route', async () => {
    routeRef.name = 'server-issues';
    const wrapper = await mountPage();
    expect(
      wrapper.findComponent(ServerIssueSplitView).props('showDetailPane')
    ).toBe(true);
  });

  it('disables the detail pane on the create route', async () => {
    routeRef.name = 'server-issues-create';
    const wrapper = await mountPage();
    expect(
      wrapper.findComponent(ServerIssueSplitView).props('showDetailPane')
    ).toBe(false);
  });
});
