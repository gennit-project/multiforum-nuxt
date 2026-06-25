import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' } }),
}));

const FormRowStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.content?.() ?? slots.default?.());
  },
});

const buildWrapper = async () => {
  const Page = (await import('./suspended-mods.vue')).default;
  return shallowMount(Page, { global: { stubs: { FormRow: FormRowStub } } });
};

describe('forum suspended mods page', () => {
  it('names the current forum in the description', async () => {
    const wrapper = await buildWrapper();
    expect(wrapper.text()).toContain(
      'These mods have been suspended from cats.'
    );
  });

  it('renders the suspended mod list', async () => {
    const wrapper = await buildWrapper();
    const SuspendedModList = (
      await import('@/components/channel/form/SuspendedModList.vue')
    ).default;
    expect(wrapper.findComponent(SuspendedModList).exists()).toBe(true);
  });
});
