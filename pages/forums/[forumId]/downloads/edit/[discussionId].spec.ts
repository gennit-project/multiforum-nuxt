import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import {
  UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS,
  UPDATE_DOWNLOAD_LABELS,
} from '@/graphQLData/discussion/mutations';
import CreateEditDiscussionFields from '@/components/discussion/form/CreateEditDiscussionFields.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats', discussionId: 'd1' } }),
  useRouter: () => ({ push: vi.fn() }),
  useHead: vi.fn(),
}));

// Per-document mutation trackers so we can observe which mutation ran and fire
// its onDone callback (the label update is chained off the discussion update).
const mutationTrackers = vi.hoisted(
  () => new Map<unknown, Record<string, unknown>>()
);

vi.mock('@vue/apollo-composable', async () => {
  const { ref: r } = await import('vue');
  return {
    useQuery: vi.fn(),
    useMutation: (doc: unknown) => {
      if (!mutationTrackers.has(doc)) {
        const tracker: Record<string, unknown> = {
          mutate: vi.fn(),
          loading: r(false),
          error: r(null),
          onError: vi.fn(),
          onDoneCb: null,
        };
        tracker.onDone = (cb: () => void) => {
          tracker.onDoneCb = cb;
        };
        mutationTrackers.set(doc, tracker);
      }
      return mutationTrackers.get(doc);
    },
  };
});

vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ref('mod-1'),
}));

const RequireAuthStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots['has-auth']?.());
  },
});

const RequireAuthDeniedStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots['does-not-have-auth']?.());
  },
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const setupQueries = () => {
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({
        discussions: [
          {
            id: 'd1',
            title: 'Cool model',
            body: '',
            Tags: [],
            DiscussionChannels: [],
            Author: { username: 'alice' },
            Album: { Images: [], imageOrder: [] },
            DownloadableFiles: [],
          },
        ],
      }),
      onResult: vi.fn(),
      loading: ref(false),
      error: ref(null),
    })
    .mockReturnValueOnce({
      result: ref({ channels: [] }),
      loading: ref(false),
      error: ref(null),
    });
};

const loadPage = async (requireAuthStub: unknown) => {
  setupQueries();
  const Page = (await import('./[discussionId].vue')).default;
  return shallowMount(Page, {
    global: { stubs: { RequireAuth: requireAuthStub } },
  });
};

describe('download edit page', () => {
  beforeEach(() => {
    mutationTrackers.clear();
    mockedUseQuery.mockReset();
  });

  it('renders the download edit form for authorized users', async () => {
    const wrapper = await loadPage(RequireAuthStub);
    expect(wrapper.findComponent(CreateEditDiscussionFields).exists()).toBe(
      true
    );
  });

  it('shows a permission-denied message for unauthorized users', async () => {
    const wrapper = await loadPage(RequireAuthDeniedStub);
    expect(wrapper.text()).toContain(
      'You do not have permission to see this page.'
    );
    expect(wrapper.findComponent(CreateEditDiscussionFields).exists()).toBe(
      false
    );
  });

  it('updates labels after the discussion update succeeds', async () => {
    const wrapper = await loadPage(RequireAuthStub);

    await wrapper
      .findComponent(CreateEditDiscussionFields)
      .vm.$emit('submit');

    const discussionUpdate = mutationTrackers.get(
      UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS
    ) as { mutate: ReturnType<typeof vi.fn>; onDoneCb: () => Promise<void> };
    const labelUpdate = mutationTrackers.get(UPDATE_DOWNLOAD_LABELS) as {
      mutate: ReturnType<typeof vi.fn>;
    };

    expect(discussionUpdate.mutate).toHaveBeenCalled();
    // Labels are only updated once the discussion update completes.
    expect(labelUpdate.mutate).not.toHaveBeenCalled();

    await discussionUpdate.onDoneCb();

    expect(labelUpdate.mutate).toHaveBeenCalled();
  });
});
