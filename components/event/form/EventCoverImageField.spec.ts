import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import EventCoverImageField from './EventCoverImageField.vue';

const {
  createSignedStorageUrlMock,
  uploadAndGetEmbeddedLinkMock,
  isFileSizeValidMock,
} = vi.hoisted(() => ({
  createSignedStorageUrlMock: vi.fn(),
  uploadAndGetEmbeddedLinkMock: vi.fn(),
  isFileSizeValidMock: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({ mutate: createSignedStorageUrlMock }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

vi.mock('@/utils', () => ({
  getUploadFileName: ({ username, file }: { username: string; file: File }) =>
    `${username}/${file.name}`,
  uploadAndGetEmbeddedLink: uploadAndGetEmbeddedLinkMock,
  isFileSizeValid: isFileSizeValidMock,
}));

const mountField = (imageUrl: string | null) =>
  shallowMount(EventCoverImageField, { props: { imageUrl } });

describe('EventCoverImageField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
    createSignedStorageUrlMock.mockResolvedValue({
      data: { createSignedStorageURL: { url: 'https://storage.test/upload' } },
    });
    uploadAndGetEmbeddedLinkMock.mockReturnValue(
      'https://cdn.test/cover.png'
    );
    isFileSizeValidMock.mockReturnValue({ valid: true, message: '' });
  });

  it('renders the cover image when a url is provided', () => {
    const wrapper = mountField('https://img.test/cover.png');
    expect(wrapper.get('img').attributes('src')).toBe(
      'https://img.test/cover.png'
    );
  });

  it('shows the empty state when there is no image', () => {
    expect(mountField('').text()).toContain('No cover image uploaded');
  });

  it('emits an empty url when the image is removed', async () => {
    const wrapper = mountField('https://img.test/cover.png');
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('update')?.[0]).toEqual(['']);
  });

  it('uploads a selected cover image and emits the embedded link', async () => {
    const wrapper = mountField('');
    const file = new File(['image'], 'cover.png', { type: 'image/png' });

    await wrapper.findComponent({ name: 'AddImage' }).vm.$emit('file-change', {
      fieldName: 'coverImageURL',
      event: { target: { files: [file] } },
    });
    await flushPromises();

    expect({
      signedUrlArgs: createSignedStorageUrlMock.mock.calls[0]?.[0],
      uploadArgs: uploadAndGetEmbeddedLinkMock.mock.calls[0]?.[0],
      emitted: wrapper.emitted('update')?.[0],
    }).toEqual({
      signedUrlArgs: {
        filename: 'alice/cover.png',
        contentType: 'image/png',
      },
      uploadArgs: {
        file,
        filename: 'alice/cover.png',
        fileType: 'image/png',
        signedStorageURL: 'https://storage.test/upload',
      },
      emitted: ['https://cdn.test/cover.png'],
    });
  });

  it('alerts and skips upload when the file is too large', async () => {
    isFileSizeValidMock.mockReturnValue({
      valid: false,
      message: 'File too large',
    });
    const wrapper = mountField('');

    await wrapper.findComponent({ name: 'AddImage' }).vm.$emit('file-change', {
      fieldName: 'coverImageURL',
      event: {
        target: {
          files: [new File(['large'], 'large.png', { type: 'image/png' })],
        },
      },
    });
    await flushPromises();

    expect({
      alert: vi.mocked(window.alert).mock.calls[0],
      emitted: wrapper.emitted('update'),
    }).toEqual({
      alert: ['File too large'],
      emitted: undefined,
    });
  });

  it('ignores file changes for other fields', async () => {
    const wrapper = mountField('');

    await wrapper.findComponent({ name: 'AddImage' }).vm.$emit('file-change', {
      fieldName: 'otherField',
      event: {
        target: {
          files: [new File(['image'], 'cover.png', { type: 'image/png' })],
        },
      },
    });
    await flushPromises();

    expect({
      signedUrlCalls: createSignedStorageUrlMock.mock.calls.length,
      emitted: wrapper.emitted('update'),
    }).toEqual({
      signedUrlCalls: 0,
      emitted: undefined,
    });
  });

  it('logs and skips emit when the signed URL mutation fails', async () => {
    const error = new Error('network down');
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    createSignedStorageUrlMock.mockRejectedValue(error);
    const wrapper = mountField('');

    await wrapper.findComponent({ name: 'AddImage' }).vm.$emit('file-change', {
      fieldName: 'coverImageURL',
      event: {
        target: {
          files: [new File(['image'], 'cover.png', { type: 'image/png' })],
        },
      },
    });
    await flushPromises();

    expect({
      error: consoleError.mock.calls[0],
      emitted: wrapper.emitted('update'),
    }).toEqual({
      error: ['Error uploading file:', error],
      emitted: undefined,
    });
  });
});
