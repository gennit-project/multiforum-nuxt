import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import TextInput from '@/components/TextInput.vue';
import type * as UtilsModule from '@/utils';
import type * as UtilsIndexModule from '@/utils/index';

const h = vi.hoisted(() => ({
  createSignedStorageUrl: vi.fn(),
  removeForumOwner: vi.fn(),
  permanentlyDeleteChannelBanner: vi.fn(),
  uploadAndGetEmbeddedLink: vi.fn(),
  isFileSizeValid: vi.fn(),
  username: null as unknown as { value: string | null },
  deleteLoading: null as unknown as { value: boolean },
  removeDone: undefined as undefined | (() => void),
  routerPush: vi.fn(),
}));

vi.mock('nuxt/app', async () => {
  const { ref: vref } = await import('vue');
  return {
    useRoute: () => ({ params: { forumId: 'cats' } }),
    useRouter: () => ({ push: h.routerPush }),
    useState: (_key: string, init?: () => unknown) =>
      vref(init ? init() : undefined),
  };
});

vi.mock('@/composables/useAuthState', async () => {
  const { ref: vref } = await import('vue');
  h.username ??= vref('alice');
  return { useUsername: () => h.username };
});

vi.mock('@/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof UtilsModule>();
  return {
    ...actual,
    getUploadFileName: vi.fn(() => 'alice-banner.png'),
    uploadAndGetEmbeddedLink: h.uploadAndGetEmbeddedLink,
  };
});

vi.mock('@/utils/index', async (importOriginal) => {
  const actual = await importOriginal<typeof UtilsIndexModule>();
  return {
    ...actual,
    getUploadFileName: vi.fn(() => 'alice-banner.png'),
    uploadAndGetEmbeddedLink: h.uploadAndGetEmbeddedLink,
    isFileSizeValid: h.isFileSizeValid,
  };
});

vi.mock('@/graphQLData/channel/mutations', () => ({
  PERMANENTLY_DELETE_CHANNEL_BANNER: 'PERMANENTLY_DELETE_CHANNEL_BANNER',
}));

vi.mock('@/graphQLData/mod/mutations', () => ({
  REMOVE_FORUM_OWNER: 'REMOVE_FORUM_OWNER',
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (operation: unknown) => {
    const loading =
      operation === 'PERMANENTLY_DELETE_CHANNEL_BANNER'
        ? (h.deleteLoading ??= ref(false))
        : ref(false);
    return {
      mutate:
        operation === 'PERMANENTLY_DELETE_CHANNEL_BANNER'
          ? h.permanentlyDeleteChannelBanner
          : operation === 'REMOVE_FORUM_OWNER'
            ? h.removeForumOwner
            : h.createSignedStorageUrl,
      loading,
      error: ref(null),
      onDone: (callback: () => void) => {
        if (operation === 'REMOVE_FORUM_OWNER') h.removeDone = callback;
      },
      onError: vi.fn(),
    };
  },
}));

const FormRowStub = { template: '<div><slot name="content" /></div>' };
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
const AddImageStub = {
  name: 'AddImage',
  emits: ['file-change'],
  template: '<button />',
};
const RemoveOwnerModalStub = {
  name: 'RemoveOwnerModal',
  props: ['open'],
  emits: ['close', 'confirm'],
  template: '<div />',
};
const PrimaryButtonStub = {
  name: 'PrimaryButton',
  emits: ['click'],
  template: '<button />',
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
        AddImage: AddImageStub,
        RemoveOwnerModal: RemoveOwnerModalStub,
        PrimaryButton: PrimaryButtonStub,
      },
    },
  });
};

const emitImage = (
  wrapper: Awaited<ReturnType<typeof buildWrapper>>,
  file: File
) =>
  wrapper.findComponent(AddImageStub).vm.$emit('file-change', {
    event: { target: { files: [file] } },
    fieldName: 'channelIconURL',
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.username ??= ref('alice');
  h.deleteLoading ??= ref(false);
  h.username.value = 'alice';
  h.deleteLoading.value = false;
  h.isFileSizeValid.mockReturnValue({ valid: true, message: '' });
  h.uploadAndGetEmbeddedLink.mockReturnValue('https://cdn.example.com/new.png');
  h.createSignedStorageUrl.mockResolvedValue({
    data: {
      createSignedStorageURL: {
        url: 'https://upload.example.com',
        storageUrl: 'https://cdn.example.com',
      },
    },
  });
  h.permanentlyDeleteChannelBanner.mockResolvedValue({ data: {} });
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
    await wrapper
      .get('[data-testid="delete-channel-banner-button"]')
      .trigger('click');
    await wrapper
      .getComponent(WarningModalStub)
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
    await wrapper
      .getComponent(WarningModalStub)
      .vm.$emit('primary-button-click');
    await flushPromises();
    expect(wrapper.emitted()).toMatchObject({
      updateFormValues: [[{ channelBannerURL: '' }]],
      submit: [[]],
    });
  });

  it('uploads an image and submits the resulting field update', async () => {
    const wrapper = await buildWrapper({});
    emitImage(
      wrapper,
      new File(['banner'], 'banner.png', { type: 'image/png' })
    );
    await flushPromises();
    expect(wrapper.emitted()).toMatchObject({
      updateFormValues: [
        [{ channelIconURL: 'https://cdn.example.com/new.png' }],
      ],
      submit: [[]],
    });
  });

  it('does not upload when no user is signed in', async () => {
    h.username.value = null;
    const wrapper = await buildWrapper({});
    emitImage(wrapper, new File(['banner'], 'banner.png'));
    await flushPromises();
    expect(h.createSignedStorageUrl).not.toHaveBeenCalled();
  });

  it('rejects an oversized upload before requesting a signed URL', async () => {
    h.isFileSizeValid.mockReturnValue({ valid: false, message: 'Too large' });
    vi.stubGlobal('alert', vi.fn());
    const wrapper = await buildWrapper({});
    emitImage(wrapper, new File(['x'], 'large.png'));
    await flushPromises();
    expect(globalThis.alert).toHaveBeenCalledWith('Too large');
  });

  it('does not submit when signed URL creation fails', async () => {
    h.createSignedStorageUrl.mockRejectedValueOnce(new Error('offline'));
    const wrapper = await buildWrapper({});
    emitImage(wrapper, new File(['x'], 'banner.png'));
    await flushPromises();
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('shows a permanent-delete rejection in the confirmation modal', async () => {
    h.permanentlyDeleteChannelBanner.mockRejectedValueOnce(
      new Error('Delete denied')
    );
    const wrapper = await buildWrapper({
      channelBannerURL: 'https://cdn.example.com/banner.png',
    });
    await wrapper
      .getComponent(WarningModalStub)
      .vm.$emit('primary-button-click');
    await flushPromises();
    expect(wrapper.getComponent(WarningModalStub).props('error')).toBe(
      'Delete denied'
    );
  });

  it('keeps the delete modal open while a deletion is loading', async () => {
    const wrapper = await buildWrapper({
      channelBannerURL: 'https://cdn.example.com/banner.png',
    });
    await wrapper
      .get('[data-testid="delete-channel-banner-button"]')
      .trigger('click');
    h.deleteLoading.value = true;
    await wrapper.getComponent(WarningModalStub).vm.$emit('close');
    expect(wrapper.getComponent(WarningModalStub).props('open')).toBe(true);
  });

  it('removes the signed-in owner and redirects after completion', async () => {
    const wrapper = await buildWrapper({});
    await wrapper.findComponent(PrimaryButtonStub).vm.$emit('click');
    await wrapper.getComponent(RemoveOwnerModalStub).vm.$emit('confirm');
    h.removeDone?.();
    expect([h.removeForumOwner.mock.calls, h.routerPush.mock.calls]).toEqual([
      [[{ username: 'alice', channelUniqueName: 'cats' }]],
      [[{ name: 'forums-forumId', params: { forumId: 'cats' } }]],
    ]);
  });
});
