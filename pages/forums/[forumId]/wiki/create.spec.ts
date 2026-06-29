import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import PrimaryButton from '@/components/PrimaryButton.vue';
import SuspensionNotice from '@/components/SuspensionNotice.vue';
import InfoBanner from '@/components/InfoBanner.vue';
import TextInput from '@/components/TextInput.vue';
import TextEditor from '@/components/TextEditor.vue';

const suspension = vi.hoisted(() => ({
  active: null as unknown,
  issueNumber: null as number | null,
}));
const channel = vi.hoisted(() => ({
  wikiEnabled: true as boolean | null,
}));
const createMutate = vi.hoisted(() => vi.fn());

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' }, query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  return {
    useMutation: () => ({
      mutate: createMutate,
      loading: ref(false),
      error: ref(null),
      onDone: vi.fn(),
    }),
    useQuery: () => ({
      result: ref({
        channels: [{ uniqueName: 'cats', wikiEnabled: channel.wikiEnabled }],
      }),
      loading: ref(false),
      error: ref(null),
    }),
  };
});

vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  return { useUsername: () => ref('alice') };
});

vi.mock('@/composables/useSuspensionNotice', async () => {
  const { ref } = await import('vue');
  return {
    useChannelSuspensionNotice: () => ({
      activeSuspension: ref(suspension.active),
      issueNumber: ref(suspension.issueNumber),
      suspendedUntil: ref(null),
      suspendedIndefinitely: ref(false),
      channelId: ref('cats'),
    }),
  };
});

const mountPage = async () => {
  const Page = (await import('./create.vue')).default;
  return shallowMount(Page);
};

const editReasonInput = (wrapper: Awaited<ReturnType<typeof mountPage>>) =>
  wrapper
    .findAllComponents(TextInput)
    .find((c) => c.props('testId') === 'edit-reason-input');

describe('wiki create page', () => {
  beforeEach(() => {
    suspension.active = null;
    suspension.issueNumber = null;
    channel.wikiEnabled = true;
    createMutate.mockReset();
  });

  it('shows the form with an edit-reason field for an unsuspended user', async () => {
    const wrapper = await mountPage();

    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.findComponent(PrimaryButton).exists()).toBe(true);
    expect(editReasonInput(wrapper)).toBeTruthy();
    expect(wrapper.findComponent(SuspensionNotice).exists()).toBe(false);
  });

  it('hides the form and shows a notice for a suspended user', async () => {
    suspension.active = { suspendedIndefinitely: true };
    suspension.issueNumber = 7;
    const wrapper = await mountPage();

    expect(wrapper.find('form').exists()).toBe(false);
    expect(wrapper.findComponent(SuspensionNotice).exists()).toBe(true);
  });

  it('hides the form when the forum has the wiki disabled', async () => {
    channel.wikiEnabled = false;
    const wrapper = await mountPage();

    expect(wrapper.find('form').exists()).toBe(false);
  });

  it('shows a wiki-disabled notice when the forum has the wiki disabled', async () => {
    channel.wikiEnabled = false;
    const wrapper = await mountPage();

    expect(wrapper.findComponent(InfoBanner).exists()).toBe(true);
  });

  it('does not show the wiki-disabled notice when the wiki is enabled', async () => {
    const wrapper = await mountPage();

    expect(wrapper.findComponent(InfoBanner).exists()).toBe(false);
  });

  it('submits the entered edit reason with the create mutation', async () => {
    const wrapper = await mountPage();

    const titleInput = wrapper
      .findAllComponents(TextInput)
      .find((c) => c.props('testId') === 'title-input');
    await titleInput?.vm.$emit('update', 'My Title');
    await wrapper.findComponent(TextEditor).vm.$emit('update', 'Body content');
    await editReasonInput(wrapper)?.vm.$emit('update', 'Fixed wording');

    await wrapper.find('form').trigger('submit');

    expect(createMutate).toHaveBeenCalledTimes(1);
    const node =
      createMutate.mock.calls[0][0].update.WikiHomePage.create.node;
    expect(node.title).toBe('My Title');
    expect(node.body).toBe('Body content');
    expect(node.editReason).toBe('Fixed wording');
  });
});
