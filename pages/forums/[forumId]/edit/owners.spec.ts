import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import ForumOwnerList from '@/components/channel/form/ForumOwnerList.vue';
import PendingForumOwnerList from '@/components/channel/form/PendingForumOwnerList.vue';

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

describe('forum owners edit page', () => {
  it('renders the current and pending owner lists', async () => {
    const Page = (await import('./owners.vue')).default;
    const wrapper = shallowMount(Page, {
      global: { stubs: { FormRow: FormRowStub } },
    });
    expect([
      wrapper.findComponent(ForumOwnerList).exists(),
      wrapper.findComponent(PendingForumOwnerList).exists(),
    ]).toEqual([true, true]);
  });
});
