import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import TextInput from '@/components/TextInput.vue';

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

vi.mock('@/composables/useSuspensionNotice', () => ({
  useChannelSuspensionNotice: () => ({
    activeSuspension: ref(null),
    issueNumber: ref(null),
    suspendedUntil: ref(null),
    suspendedIndefinitely: ref(false),
    channelId: ref('cats'),
  }),
}));

vi.mock('nuxt/app', async () => {
  const { ref: vref } = await import('vue');
  return {
    useRoute: () => ({ params: { forumId: 'cats', slug: 'intro' } }),
    useRouter: () => ({ push: vi.fn() }),
    useState: (_key: string, init?: () => unknown) =>
      vref(init ? init() : undefined),
  };
});

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    result: ref({
      wikiPages: [{ id: 'w1', title: 'Intro', body: 'Hi' }],
      channels: [{ wikiEnabled: true }],
    }),
    loading: ref(false),
    error: ref(null),
  })),
  useMutation: () => ({
    mutate: vi.fn(),
    loading: ref(false),
    error: ref(null),
    onDone: vi.fn(),
    onError: vi.fn(),
  }),
}));

describe('wiki edit page', () => {
  it('renders the wiki title input when the page loads', async () => {
    const Page = (await import('./[slug].vue')).default;
    const wrapper = shallowMount(Page);
    expect(wrapper.findComponent(TextInput).exists()).toBe(true);
  });
});
