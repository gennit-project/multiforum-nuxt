import { CreateDiscussionDocument } from '@/__generated__/operations';
import { variableErrors } from '@/tests/utils/operationVariables';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, reactive } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

import CreateDownload from '@/components/download/form/CreateDownload.vue';

const h = vi.hoisted(() => ({
  username: null as unknown,
  channelResult: null as unknown,
  channelLoading: null as unknown,
  createDownload: null as unknown,
  updateLabels: null as unknown,
  updateSupport: null as unknown,
  onDone: undefined as undefined | ((r: unknown) => void),
  push: null as unknown,
  route: null as unknown,
  callIndex: { n: 0 },
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.channelResult, loading: h.channelLoading }),
  useMutation: () => {
    h.callIndex.n++;
    if (h.callIndex.n === 1)
      return {
        mutate: h.createDownload,
        loading: ref(false),
        error: ref(null),
        onDone: (cb: (r: unknown) => void) => {
          h.onDone = cb;
        },
      };
    if (h.callIndex.n === 2)
      return { mutate: h.updateLabels, loading: ref(false), error: ref(null) };
    return { mutate: h.updateSupport, loading: ref(false), error: ref(null) };
  },
}));
vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
  useRouter: () => ({ push: h.push }),
}));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => h.username,
}));

const fieldsStub = {
  name: 'CreateEditDiscussionFields',
  props: [
    'formValues',
    'channelData',
    'createDiscussionLoading',
    'downloadMode',
    'lockedChannelName',
  ],
  emits: ['submit', 'update-form-values'],
  template: '<div />',
};

const mountCreate = () =>
  mount(CreateDownload, {
    global: {
      stubs: {
        CreateEditDiscussionFields: fieldsStub,
        ErrorBanner: {
          name: 'ErrorBanner',
          props: ['text'],
          template: '<div class="error-banner">{{ text }}</div>',
        },
      },
    },
  });

const fields = (wrapper: ReturnType<typeof mount>) =>
  wrapper.getComponent({ name: 'CreateEditDiscussionFields' });

const submit = async (
  wrapper: ReturnType<typeof mount>,
  values: Record<string, unknown> = {}
) => {
  if (Object.keys(values).length) {
    await fields(wrapper).vm.$emit('update-form-values', values);
  }
  await fields(wrapper).vm.$emit('submit');
  await flushPromises();
};

beforeEach(() => {
  h.username = ref('alice');
  h.channelResult = ref({
    channels: [{ downloadsEnabled: true, FilterGroups: [] }],
  });
  h.channelLoading = ref(false);
  h.createDownload = vi.fn(() => new Promise((resolve) => { h.onDone = resolve; }));
  h.updateLabels = vi.fn().mockResolvedValue({});
  h.updateSupport = vi.fn().mockResolvedValue({});
  h.push = vi.fn();
  h.onDone = undefined;
  h.callIndex.n = 0;
  h.route = reactive({ params: { forumId: 'cats' } });
});

describe('CreateDownload rendering', () => {
  it('shows a loading message while the channel query is in flight', () => {
    (h.channelLoading as { value: boolean }).value = true;
    const wrapper = mountCreate();

    expect(wrapper.text()).toContain('Loading channel data');
  });

  it('passes channel data to the form fields', () => {
    const wrapper = mountCreate();

    expect(fields(wrapper).props('channelData')).toMatchObject({
      downloadsEnabled: true,
    });
  });

  it('seeds the selected channel from the forumId route param', () => {
    const wrapper = mountCreate();

    expect(
      (fields(wrapper).props('formValues') as { selectedChannels: string[] })
        .selectedChannels
    ).toEqual(['cats']);
  });

  it('locks forum selection to the routed forum', () => {
    const wrapper = mountCreate();

    expect(fields(wrapper).props('lockedChannelName')).toBe('cats');
  });
});

describe('CreateDownload submit', () => {
  it('blocks submission when downloads are disabled', async () => {
    (h.channelResult as { value: unknown }).value = {
      channels: [{ downloadsEnabled: false }],
    };
    const wrapper = mountCreate();

    await submit(wrapper, { title: 'T' });

    expect(h.createDownload).not.toHaveBeenCalled();
  });

  it('surfaces an error banner when downloads are disabled', async () => {
    (h.channelResult as { value: unknown }).value = {
      channels: [{ downloadsEnabled: false }],
    };
    const wrapper = mountCreate();

    await submit(wrapper, { title: 'T' });

    expect(wrapper.find('.error-banner').exists()).toBe(true);
  });

  it('creates the download with the entered title', async () => {
    const wrapper = mountCreate();

    await submit(wrapper, { title: 'My Model' });

    expect(
      (h.createDownload as ReturnType<typeof vi.fn>).mock.calls[0][0].input[0]
        .discussionCreateInput.title
    ).toBe('My Model');
  });

  it('omits client author and preserves tag, channel and crosspost intent', async () => {
    const wrapper = mountCreate();
    await submit(wrapper, {
      title: 'T',
      selectedTags: ['models'],
      crosspostId: 'source',
    });

    expect(h.createDownload).toHaveBeenCalledWith({
      input: [
        {
          channelConnections: ['cats'],
          crosspostedDiscussionId: 'source',
          discussionCreateInput: {
            title: 'T',
            body: '',
            hasDownload: true,
            Tags: {
              connect: [{ where: { node: { text: { eq: 'models' } } } }],
            },
          },
        },
      ],
    });
  });

  it('sends a schema-valid download create payload with file ID filters', async () => {
    const wrapper = mountCreate();
    await submit(wrapper, {
      title: 'T',
      selectedTags: ['models'],
      downloadableFiles: [{ id: 'file-1' }],
      crosspostId: 'source',
      album: { images: [{ id: 'reused' }], imageOrder: ['reused'] },
    });
    const variables = (h.createDownload as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(variableErrors(CreateDiscussionDocument, variables)).toEqual([]);
  });

  it('connects downloadable files that have ids', async () => {
    const wrapper = mountCreate();

    await submit(wrapper, {
      title: 'T',
      downloadableFiles: [{ id: 'f1' }, { id: '' }],
    });

    expect(
      (h.createDownload as ReturnType<typeof vi.fn>).mock.calls[0][0].input[0]
        .discussionCreateInput.DownloadableFiles.connect
    ).toEqual([{ where: { node: { id: { eq: 'f1' } } } }]);
  });
});

describe('CreateDownload onDone follow-ups', () => {
  const respond = (id = 'newD') => ({
    data: {
      createDiscussionWithChannelConnections: [
        { id, DiscussionChannels: [{ Discussion: { id } }] },
      ],
    },
  });

  it('navigates to the new download page on success', async () => {
    const wrapper = mountCreate();
    await submit(wrapper, { title: 'T' });

    await h.onDone?.(respond());
    await flushPromises();

    expect(h.push).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ discussionId: 'newD' }),
      })
    );
  });

  it('does not navigate when the response has no discussion id', async () => {
    const wrapper = mountCreate();
    await submit(wrapper, { title: 'T' });

    await h.onDone?.({ data: {} });
    await flushPromises();

    expect(h.push).not.toHaveBeenCalled();
  });

  it('creates the album in the initial request without a follow-up mutation', async () => {
    const wrapper = mountCreate();
    await submit(wrapper, {
      title: 'T',
      album: { images: [{ id: 'img1' }], imageOrder: ['img1'] },
    });

    await h.onDone?.(respond());
    await flushPromises();

    expect((h.createDownload as ReturnType<typeof vi.fn>).mock.calls[0][0].input[0].discussionCreateInput.Album.create.node.imageOrder).toEqual(['img1']);
  });

  it('preserves the album payload and excludes images without IDs', async () => {
    const wrapper = mountCreate();
    await submit(wrapper, {
      title: 'T',
      album: { images: [{ id: 'img1' }, { id: '' }], imageOrder: ['img1'] },
    });

    await h.onDone?.(respond());
    await flushPromises();

    expect((h.createDownload as ReturnType<typeof vi.fn>).mock.calls[0][0].input[0].discussionCreateInput.Album).toEqual({
      create: { node: {
        imageOrder: ['img1'],
        Images: { connect: [{ where: { node: { id: { eq: 'img1' } } } }] },
      } },
    });
  });

  it('saves download labels mapped to filter-option ids', async () => {
    (h.channelResult as { value: unknown }).value = {
      channels: [
        {
          downloadsEnabled: true,
          FilterGroups: [
            { key: 'color', options: [{ value: 'red', id: 'opt-red' }] },
          ],
        },
      ],
    };
    const wrapper = mountCreate();
    await submit(wrapper, { title: 'T', downloadLabels: { color: ['red'] } });

    await h.onDone?.(respond());
    await flushPromises();

    expect(h.updateLabels).toHaveBeenCalledWith(
      expect.objectContaining({ labelOptionIds: ['opt-red'] })
    );
  });

  it('does not write labels or redirect after navigation during creation', async () => {
    const wrapper = mountCreate();
    await submit(wrapper, { title: 'T', downloadableFiles: [{ id: 'f1' }] });
    const route = h.route as { params: { forumId: string } };
    route.params.forumId = 'dogs';
    await flushPromises();
    await h.onDone?.(respond());
    await flushPromises();
    expect([h.updateLabels, h.updateSupport, h.push].map((mock) => (mock as ReturnType<typeof vi.fn>).mock.calls.length)).toEqual([0, 0, 0]);
  });

  it('does not redirect after the form unmounts during creation', async () => {
    const wrapper = mountCreate();
    await submit(wrapper, { title: 'T' });
    wrapper.unmount();
    await h.onDone?.(respond());
    await flushPromises();
    expect(h.push).not.toHaveBeenCalled();
  });

  it('submits only once while creation is pending', async () => {
    const wrapper = mountCreate();
    await submit(wrapper, { title: 'T' });
    await submit(wrapper, { title: 'Repeated' });
    expect(h.createDownload).toHaveBeenCalledTimes(1);
  });

  it('uses captured support settings after the form changes', async () => {
    const wrapper = mountCreate();
    await submit(wrapper, { title: 'T', downloadableFiles: [{ id: 'original', supportPatreonUrl: 'original-url' }] });
    await fields(wrapper).vm.$emit('update-form-values', { downloadableFiles: [{ id: 'later', supportPatreonUrl: 'later-url' }] });
    await h.onDone?.(respond());
    await flushPromises();
    expect(h.updateSupport).toHaveBeenCalledWith(expect.objectContaining({ downloadableFileId: 'original', input: expect.objectContaining({ supportPatreonUrl: 'original-url' }) }));
  });

  it('does not run follow-ups twice for the same resolution', async () => {
    const wrapper = mountCreate();
    await submit(wrapper, { title: 'T' });
    await h.onDone?.(respond());
    await h.onDone?.(respond());
    await flushPromises();
    expect(h.push).toHaveBeenCalledTimes(1);
  });

  it('saves support settings for files with ids', async () => {
    const wrapper = mountCreate();
    await submit(wrapper, {
      title: 'T',
      downloadableFiles: [{ id: 'f1', supportPatreonUrl: 'p' }],
    });

    await h.onDone?.(respond());
    await flushPromises();

    expect(h.updateSupport).toHaveBeenCalled();
  });
});

describe('CreateDownload form updates', () => {
  it('merges emitted form values into the current form state', async () => {
    const wrapper = mountCreate();

    await fields(wrapper).vm.$emit('update-form-values', { title: 'Edited' });

    expect(
      (fields(wrapper).props('formValues') as { title: string }).title
    ).toBe('Edited');
  });
});
