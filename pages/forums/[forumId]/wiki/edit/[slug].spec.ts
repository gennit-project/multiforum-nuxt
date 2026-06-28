import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import TextInput from '@/components/TextInput.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import SuspensionNotice from '@/components/SuspensionNotice.vue';

const suspension = vi.hoisted(() => ({
  active: null as unknown,
  issueNumber: null as number | null,
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

vi.mock('@/composables/useSuspensionNotice', () => ({
  useChannelSuspensionNotice: () => ({
    activeSuspension: ref(suspension.active),
    issueNumber: ref(suspension.issueNumber),
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

const mountPage = async () => {
  const Page = (await import('./[slug].vue')).default;
  return shallowMount(Page);
};

describe('wiki edit page', () => {
  beforeEach(() => {
    suspension.active = null;
    suspension.issueNumber = null;
  });

  it('renders the title and edit-reason inputs when the page loads', async () => {
    const wrapper = await mountPage();
    expect(wrapper.findComponent(TextInput).exists()).toBe(true);
    expect(
      wrapper
        .findAllComponents(TextInput)
        .some((c) => c.props('testId') === 'edit-reason-input')
    ).toBe(true);
  });

  it('hides the form and shows a notice for a suspended user', async () => {
    suspension.active = { suspendedIndefinitely: true };
    suspension.issueNumber = 11;
    const wrapper = await mountPage();

    expect(wrapper.findComponent(PrimaryButton).exists()).toBe(false);
    expect(wrapper.findComponent(SuspensionNotice).exists()).toBe(true);
  });
});
