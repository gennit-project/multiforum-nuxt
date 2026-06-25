import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import PrimaryButton from '@/components/PrimaryButton.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' }, query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: ref({ channels: [{ wikiEnabled: true }] }),
    loading: ref(false),
    error: ref(null),
  }),
  useMutation: () => ({
    mutate: vi.fn(),
    loading: ref(false),
    error: ref(null),
    onDone: vi.fn(),
    onError: vi.fn(),
  }),
}));

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

describe('wiki create-child page', () => {
  it('renders the create form actions when the wiki is enabled', async () => {
    const Page = (await import('./create-child.vue')).default;
    const wrapper = shallowMount(Page);
    expect(wrapper.findComponent(PrimaryButton).exists()).toBe(true);
  });
});
