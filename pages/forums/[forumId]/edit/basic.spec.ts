import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import TextInput from '@/components/TextInput.vue';

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
  useMutation: () => ({
    mutate: vi.fn(),
    loading: ref(false),
    error: ref(null),
    onDone: vi.fn(),
    onError: vi.fn(),
  }),
}));

const FormRowStub = { template: '<div><slot name="content" /></div>' };
// The page auto-focuses the title input on mount; give the stub a focus method.
const TextInputStub = {
  name: 'TextInput',
  template: '<input />',
  methods: { focus() {} },
};

describe('forum basic settings page', () => {
  it('renders the editable channel text fields', async () => {
    const Page = (await import('./basic.vue')).default;
    const wrapper = shallowMount(Page, {
      props: {
        editMode: true,
        formValues: {
          uniqueName: 'cats',
          displayName: 'Cats',
          description: '',
          selectedTags: [],
          channelIconURL: '',
          channelBannerURL: '',
        },
      },
      global: { stubs: { FormRow: FormRowStub, TextInput: TextInputStub } },
    });
    expect(wrapper.findComponent(TextInput).exists()).toBe(true);
  });
});
