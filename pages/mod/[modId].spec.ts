import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import ModProfileTabs from '@/components/mod/ModProfileTabs.vue';

vi.stubGlobal('definePageMeta', vi.fn());

const useHead = vi.fn();

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { modId: 'coolmod' } }),
  useHead: (...args: unknown[]) => useHead(...args),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const SlotStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountPage = async (mod: unknown) => {
  mockedUseQuery.mockReturnValue({
    result: ref(mod ? { moderationProfiles: [mod] } : { moderationProfiles: [] }),
    error: ref(null),
  });
  const Page = (await import('./[modId].vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: { NuxtLayout: SlotStub, ClientOnly: SlotStub, NuxtPage: true },
    },
  });
};

describe('mod profile layout page', () => {
  it('sets the page title from the mod display name', async () => {
    await mountPage({ displayName: 'Cool Mod' });
    expect(useHead).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Cool Mod - Mod Profile'),
      })
    );
  });

  it('renders the mod profile tabs when the mod loads', async () => {
    const wrapper = await mountPage({ displayName: 'Cool Mod' });
    expect(wrapper.findComponent(ModProfileTabs).exists()).toBe(true);
  });

  it('hides the tabs when no mod is found', async () => {
    const wrapper = await mountPage(null);
    expect(wrapper.findComponent(ModProfileTabs).exists()).toBe(false);
  });
});
