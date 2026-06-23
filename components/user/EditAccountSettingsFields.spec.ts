import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

import EditAccountSettingsFields from '@/components/user/EditAccountSettingsFields.vue';

const h = vi.hoisted(() => ({
  username: null as unknown,
  createSignedStorageUrl: vi.fn(),
  uploadLink: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({ mutate: h.createSignedStorageUrl }),
}));
vi.mock('@/composables/useAuthState', () => ({ useUsername: () => h.username }));
vi.mock('@/utils', async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return {
    ...actual,
    uploadAndGetEmbeddedLink: (...a: unknown[]) =>
      (h.uploadLink as (...x: unknown[]) => unknown)(...a),
  };
});

const stub = (name: string, props: string[] = [], emits: string[] = []) => ({
  name,
  props,
  emits,
  template: '<div><slot /></div>',
});

const mountFields = (props: Record<string, unknown> = {}) =>
  mount(EditAccountSettingsFields, {
    props: {
      formValues: { displayName: 'Alice', bio: 'hi', profilePicURL: '' },
      ...props,
    },
    global: {
      mocks: { $t: (k: string) => k },
      stubs: {
        FormComponent: stub('FormComponent', ['needsChanges', 'loading'], ['input', 'submit']),
        FormRow: { template: '<div><slot name="content" /></div>' },
        TextInput: {
          name: 'TextInput',
          props: ['value', 'disabled'],
          emits: ['update'],
          // The component focuses $el.children[0].childNodes[0] in a nextTick on
          // create; give the stub that nested structure so it doesn't throw.
          template: '<div><span><input /></span></div>',
        },
        TextEditor: stub('TextEditor', ['initialValue'], ['update']),
        AddImage: stub('AddImage', ['fieldName'], ['file-change']),
        CharCounter: stub('CharCounter', ['current', 'max']),
        AvatarComponent: true,
      },
    },
  });

const displayNameInput = (w: ReturnType<typeof mount>) =>
  w.findAllComponents({ name: 'TextInput' })[1];

const changeProfilePic = async (w: ReturnType<typeof mount>, file: File) => {
  await w.getComponent({ name: 'AddImage' }).vm.$emit('file-change', {
    event: { target: { files: [file] } },
    fieldName: 'coverImageURL',
  });
  await flushPromises();
};

beforeEach(() => {
  vi.clearAllMocks();
  h.username = ref('alice');
  vi.stubGlobal('alert', vi.fn());
  h.createSignedStorageUrl.mockResolvedValue({
    data: { createSignedStorageURL: { url: 'https://signed' } },
  });
  h.uploadLink.mockResolvedValue('https://cdn.example.com/pic.png');
});

describe('EditAccountSettingsFields states', () => {
  it('shows a loading message while the user is loading with no form', () => {
    const wrapper = mountFields({ formValues: null, userLoading: true });

    expect(wrapper.text()).toContain('common.loading');
  });

  it('shows query errors', () => {
    const wrapper = mountFields({
      formValues: null,
      getUserError: { graphQLErrors: [{ message: 'nope' }] },
    });

    expect(wrapper.text()).toContain('nope');
  });

  it('renders the form when form values are present', () => {
    const wrapper = mountFields();

    expect(wrapper.findComponent({ name: 'FormComponent' }).exists()).toBe(true);
  });
});

describe('EditAccountSettingsFields editing', () => {
  it('emits a display-name change', async () => {
    const wrapper = mountFields();

    await displayNameInput(wrapper).vm.$emit('update', 'New Name');

    expect(wrapper.emitted('updateFormValues')?.at(-1)?.[0]).toEqual({
      displayName: 'New Name',
    });
  });

  it('emits a bio change', async () => {
    const wrapper = mountFields();

    await wrapper.getComponent({ name: 'TextEditor' }).vm.$emit('update', 'new bio');

    expect(wrapper.emitted('updateFormValues')?.at(-1)?.[0]).toEqual({
      bio: 'new bio',
    });
  });

  it('emits submit from the form', async () => {
    const wrapper = mountFields();

    await wrapper.getComponent({ name: 'FormComponent' }).vm.$emit('submit');

    expect(wrapper.emitted('submit')).toBeTruthy();
  });

  it('flags needsChanges when the bio is too long', () => {
    const wrapper = mountFields({
      formValues: { displayName: 'A', bio: 'x'.repeat(5000), profilePicURL: '' },
    });

    expect(
      wrapper.getComponent({ name: 'FormComponent' }).props('needsChanges')
    ).toBe(true);
  });
});

describe('EditAccountSettingsFields profile picture upload', () => {
  it('uploads and emits the new picture URL then submits', async () => {
    const wrapper = mountFields();

    await changeProfilePic(wrapper, new File(['x'], 'pic.png'));

    expect(wrapper.emitted('updateFormValues')?.at(-1)?.[0]).toEqual({
      profilePicURL: 'https://cdn.example.com/pic.png',
    });
  });

  it('emits submit after a successful upload', async () => {
    const wrapper = mountFields();

    await changeProfilePic(wrapper, new File(['x'], 'pic.png'));

    expect(wrapper.emitted('submit')).toBeTruthy();
  });

  it('alerts and skips upload for an oversized profile picture', async () => {
    const wrapper = mountFields();
    const big = new File(['x'], 'big.png');
    Object.defineProperty(big, 'size', { value: 5 * 1024 * 1024 });

    await changeProfilePic(wrapper, big);

    expect(h.createSignedStorageUrl).not.toHaveBeenCalled();
  });
});
