import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import SuspensionNotice from '@/components/SuspensionNotice.vue';
import TextInput from '@/components/TextInput.vue';

const suspension = vi.hoisted(() => ({
  active: null as unknown,
  issueNumber: null as number | null,
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' }, query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    // create-child only renders the form when a wiki home page exists.
    result: ref({
      channels: [{ wikiEnabled: true, WikiHomePage: { id: 'home-1' } }],
    }),
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
    activeSuspension: ref(suspension.active),
    issueNumber: ref(suspension.issueNumber),
    suspendedUntil: ref(null),
    suspendedIndefinitely: ref(false),
    channelId: ref('cats'),
  }),
}));

const mountPage = async () => {
  const Page = (await import('./create-child.vue')).default;
  return shallowMount(Page);
};

describe('wiki create-child page', () => {
  beforeEach(() => {
    suspension.active = null;
    suspension.issueNumber = null;
  });

  it('renders the create form with an edit-reason field when wiki is enabled', async () => {
    const wrapper = await mountPage();
    expect(wrapper.findComponent(PrimaryButton).exists()).toBe(true);
    expect(
      wrapper
        .findAllComponents(TextInput)
        .some((c) => c.props('testId') === 'edit-reason-input')
    ).toBe(true);
  });

  it('hides the form and shows a notice for a suspended user', async () => {
    suspension.active = { suspendedIndefinitely: true };
    suspension.issueNumber = 9;
    const wrapper = await mountPage();

    expect(wrapper.findComponent(PrimaryButton).exists()).toBe(false);
    expect(wrapper.findComponent(SuspensionNotice).exists()).toBe(true);
  });
});
