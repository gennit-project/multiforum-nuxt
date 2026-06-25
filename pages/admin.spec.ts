import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import ServerTabs from '@/components/admin/ServerTabs.vue';

const routeRef: { name: string } = { name: 'admin-issues' };

vi.mock('nuxt/app', () => ({
  useRoute: () => routeRef,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const NuxtLayoutStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (result: unknown) => {
  mockedUseQuery.mockReturnValue({
    result: ref(result),
    error: ref(null),
  });
  const Page = (await import('./admin.vue')).default;
  return shallowMount(Page, {
    global: { stubs: { NuxtLayout: NuxtLayoutStub, NuxtPage: true } },
  });
};

describe('admin layout page', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    routeRef.name = 'admin-issues';
  });

  it('renders the server tabs when the server config loads', async () => {
    const wrapper = await mountWith({ serverConfigs: [{ id: 's1' }] });
    expect(wrapper.findComponent(ServerTabs).exists()).toBe(true);
  });

  it('shows a not-found message when the server config is missing', async () => {
    const wrapper = await mountWith({ serverConfigs: [] });
    expect(wrapper.text()).toContain('Server not found');
  });

  it('shows the issue detail pane on the issues route', async () => {
    const wrapper = await mountWith({ serverConfigs: [{ id: 's1' }] });
    expect(wrapper.text()).toContain('Select an issue to view details.');
  });

  it('hides the issue detail pane on other admin routes', async () => {
    routeRef.name = 'admin-roles';
    const wrapper = await mountWith({ serverConfigs: [{ id: 's1' }] });
    expect(wrapper.text()).not.toContain('Select an issue to view details.');
  });
});
