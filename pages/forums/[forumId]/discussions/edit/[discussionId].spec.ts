import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import CreateEditDiscussionFields from '@/components/discussion/form/CreateEditDiscussionFields.vue';

const hState = vi.hoisted(() => ({
  push: vi.fn(),
  useHead: vi.fn(),
  onResultCb: null as unknown as (value: unknown) => void,
  onDoneCb: null as unknown as () => void,
  mutate: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats', discussionId: 'd1' } }),
  useRouter: () => ({ push: hState.push }),
  useHead: hState.useHead,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ref('mod-1'),
}));

vi.mock('@/utils/discussionEditForm', () => ({
  buildDiscussionEditFormValues: (discussion: {
    title: string;
    body?: string;
    DiscussionChannels?: Array<{ Channel?: { uniqueName?: string } }>;
    Tags?: Array<{ text: string }>;
    Album?: { Images: unknown[]; imageOrder: string[] };
    Author?: { username?: string };
    CrosspostedDiscussion?: { id?: string } | null;
  }) => ({
    title: discussion.title,
    body: discussion.body || '',
    selectedTags: discussion.Tags?.map((tag) => tag.text) || [],
    selectedChannels:
      discussion.DiscussionChannels?.map((dc) => dc.Channel?.uniqueName || '') ||
      [],
    author: discussion.Author?.username || '',
    album: {
      images: [],
      imageOrder: [],
    },
    crosspostId: discussion.CrosspostedDiscussion?.id || null,
  }),
}));

const RequireAuthStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.hasAuth?.() || slots['has-auth']?.());
  },
});

const ClientOnlyStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

const DiscussionFieldsStub = defineComponent({
  props: ['formValues', 'editMode'],
  emits: ['submit', 'update-form-values', 'cancel'],
  setup(_props, { emit }) {
    return () =>
      h('div', [
        h(
          'button',
          {
            'data-testid': 'submit-discussion',
            onClick: () => emit('submit'),
          },
          'submit'
        ),
        h(
          'button',
          {
            'data-testid': 'cancel-discussion',
            onClick: () => emit('cancel'),
          },
          'cancel'
        ),
      ]);
  },
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;
const mockedUseMutation = useMutation as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  hState.push.mockReset();
  hState.useHead.mockReset();
  hState.mutate.mockReset();
  hState.onResultCb = null as unknown as (value: unknown) => void;
  hState.onDoneCb = null as unknown as () => void;
  mockedUseQuery.mockReturnValue({
    result: ref(null),
    onResult: (cb: (value: unknown) => void) => {
      hState.onResultCb = cb;
    },
    loading: ref(false),
    error: ref(null),
  });
  mockedUseMutation.mockReturnValue({
    mutate: hState.mutate,
    loading: ref(false),
    error: ref(null),
    onDone: (cb: () => void) => {
      hState.onDoneCb = cb;
    },
    onError: vi.fn(),
  });
});

describe('discussion edit page', () => {
  const mountPage = async (stubs = {}) => {
    const Page = (await import('./[discussionId].vue')).default;
    return shallowMount(Page, {
      global: {
        stubs: {
          RequireAuth: RequireAuthStub,
          ClientOnly: ClientOnlyStub,
          CreateEditDiscussionFields: DiscussionFieldsStub,
          ...stubs,
        },
      },
    });
  };

  it('populates the edit form from the loaded discussion', async () => {
    const wrapper = await mountPage();
    hState.onResultCb({
      loading: false,
      data: {
        discussions: [
          {
            id: 'd1',
            title: 'Hello',
            body: 'Body',
            Tags: [{ text: 'news' }],
            DiscussionChannels: [{ Channel: { uniqueName: 'cats' } }],
            Author: { username: 'alice' },
            Album: { Images: [], imageOrder: [] },
          },
        ],
      },
    });
    await nextTick();

    expect(wrapper.findComponent(CreateEditDiscussionFields).props('formValues')).toEqual(
      expect.objectContaining({
        title: 'Hello',
        selectedChannels: ['cats'],
        selectedTags: ['news'],
      })
    );
  });

  it('submits changes and redirects back to the discussion page', async () => {
    const wrapper = await mountPage();
    hState.onResultCb({
      loading: false,
      data: {
        discussions: [
          {
            id: 'd1',
            title: 'Hello',
            body: '',
            Tags: [],
            DiscussionChannels: [{ Channel: { uniqueName: 'cats' } }],
            Author: { username: 'alice' },
            Album: { Images: [], imageOrder: [] },
          },
        ],
      },
    });
    await nextTick();

    await wrapper
      .findComponent(CreateEditDiscussionFields)
      .vm.$emit('update-form-values', {
        selectedChannels: ['science'],
      });
    await wrapper.findComponent(CreateEditDiscussionFields).vm.$emit('submit');

    expect(hState.mutate).toHaveBeenCalled();
    hState.onDoneCb();
    expect(hState.push).toHaveBeenCalledWith({
      name: 'forums-forumId-discussions-discussionId',
      params: {
        forumId: 'science',
        discussionId: 'd1',
      },
    });
  });

  it('navigates back when the form is canceled', async () => {
    const wrapper = await mountPage();
    hState.onResultCb({
      loading: false,
      data: {
        discussions: [
          {
            id: 'd1',
            title: 'Hello',
            body: '',
            Tags: [],
            DiscussionChannels: [{ Channel: { uniqueName: 'cats' } }],
            Author: { username: 'alice' },
            Album: { Images: [], imageOrder: [] },
          },
        ],
      },
    });
    await nextTick();

    await wrapper
      .findComponent(CreateEditDiscussionFields)
      .vm.$emit('update-form-values', {
        selectedChannels: ['science'],
      });
    await wrapper.findComponent(CreateEditDiscussionFields).vm.$emit('cancel');

    expect(hState.push).toHaveBeenCalledWith({
      name: 'forums-forumId-discussions-discussionId',
      params: {
        forumId: 'science',
        discussionId: 'd1',
      },
    });
  });

  it('shows the permission-denied state when auth is missing', async () => {
    const Page = (await import('./[discussionId].vue')).default;
    const wrapper = shallowMount(Page, {
      global: {
        stubs: {
          RequireAuth: defineComponent({
            setup(_props, { slots }) {
              return () => h('div', slots['does-not-have-auth']?.());
            },
          }),
        },
      },
    });

    expect(wrapper.text()).toContain("You don't have permission to see this page.");
  });
});
