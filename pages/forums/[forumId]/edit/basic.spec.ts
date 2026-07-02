import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import TextInput from '@/components/TextInput.vue';

const h = vi.hoisted(() => ({
  createSignedStorageUrl: vi.fn(),
  removeForumOwner: vi.fn(),
  permanentlyDeleteChannelBanner: vi.fn(),
}));

vi.mock('nuxt/app', async () => {
  const { ref: vref } = await import('vue');
  return {
    useRoute: () => ({ params: { forumId: 'cats' } }),
    useRouter: () => ({ push: vi.fn() }),
    useState: (_key: string, init?: () => unknown) =>
      vref(init ? init() : undefined),
  };
});

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (operation: unknown) => ({
    mutate:
      operation === 'PERMANENTLY_DELETE_CHANNEL_BANNER'
        ? h.permanentlyDeleteChannelBanner
        : operation === 'REMOVE_FORUM_OWNER'
          ? h.removeForumOwner
          : h.createSignedStorageUrl,
    loading: ref(false),
    error: ref(null),
    onDone: vi.fn(),
    onError: vi.fn(),
  }),
}));

vi.mock('@/graphQLData/channel/mutations', () => ({
  PERMANENTLY_DELETE_CHANNEL_BANNER: 'PERMANENTLY_DELETE_CHANNEL_BANNER',
}));

vi.mock('@/graphQLData/mod/mutations', () => ({
  REMOVE_FORUM_OWNER: 'REMOVE_FORUM_OWNER',
}));

const FormRowStub = { template: '<div><slot name="content" /></div>' };
// The page auto-focuses the title input on mount; give the stub a focus method.
const TextInputStub = {
  name: 'TextInput',
  template: '<input />',
  methods: { focus() {} },
};

const WarningModalStub = {
  name: 'WarningModal',
  props: ['open', 'loading', 'error'],
  emits: ['primary-button-click', 'close'],
  template: '<div />',
};

const buildWrapper = async (formValues: Record<string, unknown>) => {
  const Page = (await import('./basic.vue')).default;
  return shallowMount(Page, {
    props: {
      editMode: true,
      touched: false,
      titleIsInvalid: false,
      ownerList: ['alice'],
      formValues: {
        uniqueName: 'cats',
        displayName: 'Cats',
        description: '',
        selectedTags: [],
        channelIconURL: '',
        channelBannerURL: '',
        ...formValues,
      },
    },
    global: {
      stubs: {
        FormRow: FormRowStub,
        TextInput: TextInputStub,
        WarningModal: WarningModalStub,
      },
    },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  h.permanentlyDeleteChannelBanner.mockResolvedValue({
    data: {
      permanentlyDeleteChannelBanner: {
        uniqueName: 'cats',
        channelBannerURL: null,
      },
    },
  });
});

describe('forum basic settings page', () => {
  it('renders the editable channel text fields', async () => {
    const wrapper = await buildWrapper({});

    expect(wrapper.findComponent(TextInput).exists()).toBe(true);
  });

  it('permanently deletes the current forum banner URL', async () => {
    const wrapper = await buildWrapper({
      channelBannerURL: 'https://cdn.example.com/banner.png',
    });

    await wrapper.get('[data-testid="delete-channel-banner-button"]').trigger('click');
    await wrapper
      .getComponent({ name: 'WarningModal' })
      .vm.$emit('primary-button-click');
    await flushPromises();

    expect(h.permanentlyDeleteChannelBanner).toHaveBeenCalledWith({
      channelUniqueName: 'cats',
      imageUrl: 'https://cdn.example.com/banner.png',
    });
  });

  it('clears the banner field after permanent delete succeeds', async () => {
    const wrapper = await buildWrapper({
      channelBannerURL: 'https://cdn.example.com/banner.png',
    });

    await wrapper.get('[data-testid="delete-channel-banner-button"]').trigger('click');
    await wrapper
      .getComponent({ name: 'WarningModal' })
      .vm.$emit('primary-button-click');
    await flushPromises();

    expect(wrapper.emitted('updateFormValues')?.at(-1)?.[0]).toEqual({
      channelBannerURL: '',
    });
  });
});
