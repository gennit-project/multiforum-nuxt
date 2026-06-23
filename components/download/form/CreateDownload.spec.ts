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
  updateDiscussion: null as unknown,
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
    if (h.callIndex.n === 3)
      return { mutate: h.updateDiscussion, loading: ref(false), error: ref(null) };
    return { mutate: h.updateSupport, loading: ref(false), error: ref(null) };
  },
}));
vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
  useRouter: () => ({ push: h.push }),
}));
vi.mock('@/composables/useAuthState', () => ({ useUsername: () => h.username }));

const fieldsStub = {
  name: 'CreateEditDiscussionFields',
  props: ['formValues', 'channelData', 'createDiscussionLoading', 'downloadMode'],
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
  h.createDownload = vi.fn().mockResolvedValue({});
  h.updateLabels = vi.fn().mockResolvedValue({});
  h.updateDiscussion = vi.fn().mockResolvedValue({});
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

  it('connects downloadable files that have ids', async () => {
    const wrapper = mountCreate();

    await submit(wrapper, {
      title: 'T',
      downloadableFiles: [{ id: 'f1' }, { id: '' }],
    });

    expect(
      (h.createDownload as ReturnType<typeof vi.fn>).mock.calls[0][0].input[0]
        .discussionCreateInput.DownloadableFiles.connect
    ).toHaveLength(1);
  });
});

describe('CreateDownload onDone follow-ups', () => {
  const respond = (id = 'newD') => ({
    data: { createDiscussionWithChannelConnections: { id } },
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

  it('creates the album when images were attached', async () => {
    const wrapper = mountCreate();
    await submit(wrapper, {
      title: 'T',
      album: { images: [{ id: 'img1' }], imageOrder: ['img1'] },
    });

    await h.onDone?.(respond());
    await flushPromises();

    expect(h.updateDiscussion).toHaveBeenCalled();
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
