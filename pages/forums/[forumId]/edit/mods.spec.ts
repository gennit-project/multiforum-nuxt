import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import ModList from '@/components/channel/form/ModList.vue';
import PendingForumModList from '@/components/channel/form/PendingForumModList.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' } }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: vi.fn(),
    loading: ref(false),
    error: ref(null),
    onDone: vi.fn(),
  }),
}));

const FormRowStub = { template: '<div><slot name="content" /></div>' };

describe('forum mods edit page', () => {
  it('renders the current and pending mod lists', async () => {
    const Page = (await import('./mods.vue')).default;
    const wrapper = shallowMount(Page, {
      global: { stubs: { FormRow: FormRowStub } },
    });
    expect([
      wrapper.findComponent(ModList).exists(),
      wrapper.findComponent(PendingForumModList).exists(),
    ]).toEqual([true, true]);
  });
});
