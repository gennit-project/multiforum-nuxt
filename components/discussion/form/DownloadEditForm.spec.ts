import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import type { Discussion } from '@/__generated__/graphql';

import DownloadEditForm from '@/components/discussion/form/DownloadEditForm.vue';

const h = vi.hoisted(() => ({
  username: { value: 'alice' as string | null },
  createSignedStorageUrl: undefined as unknown,
  createDownloadableFile: undefined as unknown,
  updateMutate: undefined as unknown,
  uploadLink: undefined as unknown,
  onDoneCb: { fn: undefined as undefined | (() => void) },
  callIndex: { n: 0 },
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => {
    h.callIndex.n++;
    if (h.callIndex.n === 1)
      return { mutate: h.createSignedStorageUrl, error: ref(null) };
    if (h.callIndex.n === 2)
      return { mutate: h.createDownloadableFile, error: ref(null) };
    return {
      mutate: h.updateMutate,
      error: ref(null),
      onDone: (cb: () => void) => {
        h.onDoneCb.fn = cb;
      },
    };
  },
}));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => h.username,
}));
vi.mock('@/utils', async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return {
    ...actual,
    uploadAndGetEmbeddedLink: (...a: unknown[]) =>
      (h.uploadLink as (...x: unknown[]) => unknown)(...a),
  };
});

const fileRecord = () => ({
  id: 'f1',
  fileName: 'model.stl',
  url: 'http://files/model.stl',
  kind: 'STL',
  size: 1048576,
  priceModel: 'FREE',
  priceCents: 0,
  priceCurrency: 'USD',
  license: { id: 'mit' },
});

const makeDiscussion = (overrides: Record<string, unknown> = {}) =>
  ({ id: 'd1', DownloadableFiles: [], ...overrides }) as unknown as Discussion;

const stubs = {
  FormRow: { template: '<div><slot name="content" /></div>' },
  ErrorBanner: {
    name: 'ErrorBanner',
    props: ['text'],
    template: '<div class="error-banner">{{ text }}</div>',
  },
  Notification: {
    name: 'Notification',
    props: ['show', 'title'],
    emits: ['close-notification'],
    template: '<div />',
  },
  DownloadLabelPicker: {
    name: 'DownloadLabelPicker',
    props: ['filterGroups', 'selectedLabels'],
    emits: ['update:selected-labels'],
    template: '<div />',
  },
};

const mountForm = (props: Record<string, unknown> = {}) =>
  mount(DownloadEditForm, {
    props: { discussion: makeDiscussion(), ...props },
    global: { stubs },
  });

const setFiles = async (
  wrapper: ReturnType<typeof mount>,
  selector: string,
  files: File[]
) => {
  const el = wrapper.get(selector).element as HTMLInputElement;
  Object.defineProperty(el, 'files', { value: files, configurable: true });
  await wrapper.get(selector).trigger('change');
  await flushPromises();
};

beforeEach(() => {
  h.username.value = 'alice';
  h.callIndex.n = 0;
  h.onDoneCb.fn = undefined;
  h.createSignedStorageUrl = vi.fn().mockResolvedValue({
    data: { createSignedStorageURL: { url: 'https://signed' } },
  });
  h.createDownloadableFile = vi.fn().mockResolvedValue({
    data: {
      createDownloadableFiles: {
        downloadableFiles: [
          {
            id: 'new1',
            fileName: 'new.stl',
            url: 'http://files/new.stl',
            kind: 'STL',
            size: 2048,
            priceModel: 'FREE',
            priceCents: 0,
            priceCurrency: 'USD',
          },
        ],
      },
    },
  });
  h.updateMutate = vi.fn().mockResolvedValue({});
  h.uploadLink = vi.fn().mockResolvedValue('http://files/new.stl');
});

describe('DownloadEditForm rendering', () => {
  it('shows the choose-file control when there are no files', () => {
    const wrapper = mountForm();

    expect(wrapper.text()).toContain('Choose File');
  });

  it('shows a downloads-disabled state when the channel disables downloads', () => {
    const wrapper = mountForm({ channelData: { downloadsEnabled: false } });

    expect(wrapper.text()).toContain('Downloads Disabled');
  });

  it('lists files that already exist on the discussion', async () => {
    const wrapper = mountForm({
      discussion: makeDiscussion({ DownloadableFiles: [fileRecord()] }),
    });
    await flushPromises();

    expect(wrapper.text()).toContain('model.stl');
  });

  it('renders the label picker when the channel has filter groups', () => {
    const wrapper = mountForm({
      channelData: { FilterGroups: [{ id: 'g1' }] },
    });

    expect(wrapper.findComponent({ name: 'DownloadLabelPicker' }).exists()).toBe(
      true
    );
  });
});

describe('DownloadEditForm file editing', () => {
  it('removes a file and emits the updated form values', async () => {
    const wrapper = mountForm({
      discussion: makeDiscussion({ DownloadableFiles: [fileRecord()] }),
    });
    await flushPromises();

    await wrapper.get('button[title="Delete this file"]').trigger('click');

    expect(
      (wrapper.emitted('updateFormValues')?.at(-1)?.[0] as {
        downloadableFiles: unknown[];
      }).downloadableFiles
    ).toHaveLength(0);
  });

  it('updates a file license and emits the change', async () => {
    const wrapper = mountForm({
      discussion: makeDiscussion({ DownloadableFiles: [fileRecord()] }),
    });
    await flushPromises();

    await wrapper.get('select').setValue('apache-2');

    expect(
      (
        wrapper.emitted('updateFormValues')?.at(-1)?.[0] as {
          downloadableFiles: { license: string }[];
        }
      ).downloadableFiles[0].license
    ).toBe('apache-2');
  });

  it('updates a support field and emits the change', async () => {
    const wrapper = mountForm({
      discussion: makeDiscussion({ DownloadableFiles: [fileRecord()] }),
    });
    await flushPromises();

    await wrapper.get('textarea').setValue('Thanks for downloading');

    expect(
      (
        wrapper.emitted('updateFormValues')?.at(-1)?.[0] as {
          downloadableFiles: { attributionOverride: string }[];
        }
      ).downloadableFiles[0].attributionOverride
    ).toBe('Thanks for downloading');
  });
});

describe('DownloadEditForm upload', () => {
  it('uploads a file and adds it to the form values', async () => {
    const wrapper = mountForm();

    await setFiles(wrapper, '#downloadable-file-input', [
      new File(['x'], 'new.stl'),
    ]);

    expect(h.createDownloadableFile).toHaveBeenCalled();
  });

  it('emits the new file to the parent after upload', async () => {
    const wrapper = mountForm();

    await setFiles(wrapper, '#downloadable-file-input', [
      new File(['x'], 'new.stl'),
    ]);

    expect(
      (
        wrapper.emitted('updateFormValues')?.at(-1)?.[0] as {
          downloadableFiles: { id: string }[];
        }
      ).downloadableFiles.some((f) => f.id === 'new1')
    ).toBe(true);
  });

  it('surfaces an error when the file is too large', async () => {
    const wrapper = mountForm();
    const bigFile = new File(['x'], 'big.stl');
    Object.defineProperty(bigFile, 'size', { value: 5_000 * 1024 * 1024 });

    await setFiles(wrapper, '#downloadable-file-input', [bigFile]);

    expect(wrapper.find('.error-banner').exists()).toBe(true);
  });
});

describe('DownloadEditForm save side effects', () => {
  it('shows the saved notification in temp-id (create) mode', async () => {
    const wrapper = mountForm({
      discussion: makeDiscussion({
        id: 'temp-id',
        DownloadableFiles: [fileRecord()],
      }),
    });
    await flushPromises();

    await wrapper.get('button[title="Delete this file"]').trigger('click');

    expect(
      wrapper.getComponent({ name: 'Notification' }).props('show')
    ).toBe(true);
  });

  it('closes the editor when the update mutation completes', () => {
    const wrapper = mountForm();

    h.onDoneCb.fn?.();

    expect(wrapper.emitted('closeEditor')).toBeTruthy();
  });

  it('updates download labels from the label picker', async () => {
    const wrapper = mountForm({
      channelData: { FilterGroups: [{ id: 'g1' }] },
    });

    await wrapper
      .getComponent({ name: 'DownloadLabelPicker' })
      .vm.$emit('update:selected-labels', { g1: ['a'] });

    expect(
      (
        wrapper.emitted('updateFormValues')?.at(-1)?.[0] as {
          downloadLabels: Record<string, string[]>;
        }
      ).downloadLabels
    ).toEqual({ g1: ['a'] });
  });
});
