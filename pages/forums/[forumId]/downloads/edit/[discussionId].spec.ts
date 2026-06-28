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

const emptyDiscussion = () => ({
  id: 'd1',
  title: 'Cool model',
  body: '',
  Tags: [],
  DiscussionChannels: [],
  Author: { username: 'alice' },
  Album: { Images: [], imageOrder: [] },
  DownloadableFiles: [],
});

const populatedDiscussion = () => ({
  id: 'd1',
  title: 'Cool model',
  body: 'A nice download',
  Tags: [{ text: 'art' }, { text: '3d' }],
  DiscussionChannels: [
    {
      Channel: { uniqueName: 'cats' },
      LabelOptions: [{ value: 'pdf', group: { key: 'type' } }],
    },
  ],
  Author: { username: 'alice' },
  Album: {
    Images: [{ id: 'i1', url: 'u/1', alt: 'a', caption: '', copyright: '' }],
    imageOrder: ['i1'],
  },
  DownloadableFiles: [
    { id: 'f1', fileName: 'model.zip', url: 'u/f', kind: 'OTHER', size: 10 },
  ],
});

// Captures the onResult callback the page registers, so we can fire it.
let capturedOnResult: ((value: unknown) => void) | null = null;

const setupQueries = (discussion: Record<string, unknown> = emptyDiscussion()) => {
  capturedOnResult = null;
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({ discussions: [discussion] }),
      onResult: (cb: (value: unknown) => void) => {
        capturedOnResult = cb;
      },
      loading: ref(false),
      error: ref(null),
    })
    .mockReturnValueOnce({
      result: ref({ channels: [] }),
      loading: ref(false),
      error: ref(null),
    });
};

const loadPage = async (
  requireAuthStub: unknown,
  discussion?: Record<string, unknown>
) => {
  setupQueries(discussion);
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

  it('maps an existing download into the form values', async () => {
    const wrapper = await loadPage(RequireAuthStub, populatedDiscussion());
    const formValues = wrapper
      .findComponent(CreateEditDiscussionFields)
      .props('formValues') as {
      title: string;
      selectedTags: string[];
      selectedChannels: string[];
      album: { images: unknown[]; imageOrder: string[] };
      downloadableFiles: unknown[];
    };
    expect(formValues.title).toBe('Cool model');
    expect(formValues.selectedTags).toEqual(['art', '3d']);
    expect(formValues.selectedChannels).toEqual(['cats']);
    expect(formValues.album.imageOrder).toEqual(['i1']);
    expect(formValues.album.images).toHaveLength(1);
    expect(formValues.downloadableFiles).toHaveLength(1);
  });

  it('re-populates the form when the discussion query resolves', async () => {
    const wrapper = await loadPage(RequireAuthStub, emptyDiscussion());
    expect(capturedOnResult).toBeTypeOf('function');

    capturedOnResult!({
      loading: false,
      data: { discussions: [populatedDiscussion()] },
    });
    await wrapper.vm.$nextTick();

    const formValues = wrapper
      .findComponent(CreateEditDiscussionFields)
      .props('formValues') as { downloadableFiles: unknown[]; title: string };
    expect(formValues.downloadableFiles).toHaveLength(1);
  });

  it('updates form values when the fields emit a change', async () => {
    const wrapper = await loadPage(RequireAuthStub, emptyDiscussion());
    await wrapper
      .findComponent(CreateEditDiscussionFields)
      .vm.$emit('update-form-values', { title: 'Renamed download' });
    expect(
      (
        wrapper.findComponent(CreateEditDiscussionFields).props('formValues') as {
          title: string;
        }
      ).title
    ).toBe('Renamed download');
  });
});
