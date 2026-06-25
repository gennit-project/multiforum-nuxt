import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';

const replace = vi.fn();
const routeRef: { path: string; name: string } = {
  path: '/admin/plugins',
  name: 'admin-plugins',
};

vi.mock('nuxt/app', () => ({
  useRoute: () => routeRef,
  useRouter: () => ({ replace }),
}));

const SlotStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

const mountPage = async () => {
  const Page = (await import('./plugins.vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        ClientOnly: SlotStub,
        NuxtPage: true,
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  });
};

describe('admin plugins layout page', () => {
  it('labels the current tab from the route path', async () => {
    routeRef.path = '/admin/plugins/registries';
    routeRef.name = 'admin-plugins-registries';
    replace.mockClear();
    expect((await mountPage()).text()).toContain('Registries');
  });

  it('defaults the tab label to plugin management on the base path', async () => {
    routeRef.path = '/admin/plugins';
    routeRef.name = 'admin-plugins';
    replace.mockClear();
    expect((await mountPage()).text()).toContain('Plugin Management');
  });

  it('redirects a name-only match to the canonical base path', async () => {
    routeRef.path = '/admin/plugins/';
    routeRef.name = 'admin-plugins';
    replace.mockClear();
    await mountPage();
    expect(replace).toHaveBeenCalledWith('/admin/plugins');
  });
});
