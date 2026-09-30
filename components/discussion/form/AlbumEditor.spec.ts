import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import AlbumEditor from '@/components/discussion/form/AlbumEditor.vue';

// Hoisted, controllable test seams: username (for the no-username branch) and
// the URL-image creation spy (for the submit success/failure branches).
const {
  usernameRef,
  createImageFromUrl,
  uploadsAvailable,
  uploadsCapability,
  uploadsLoading,
  uploadsError,
  saveImageMetadata,
  debouncedAutoSave,
} = vi.hoisted(() => ({
  saveImageMetadata: vi.fn(),
  debouncedAutoSave: vi.fn(),
  usernameRef: { value: 'alice' as string },
  createImageFromUrl: vi.fn(),
  uploadsAvailable: { value: true },
  uploadsCapability: {
    value: {
      configured: true,
      enabled: true,
      requiredEnvVarsMissing: [],
      setupUrl: '/admin/setup#file-uploads',
      docsPath: '/self-hosting/uploads',
    } as {
      configured: boolean;
      enabled: boolean;
      requiredEnvVarsMissing: string[];
      setupUrl: string;
      docsPath: string;
    } | null,
  },
  uploadsLoading: { value: false },
  uploadsError: { value: null as Error | null },
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => usernameRef,
  setUsername: vi.fn(),
}));
vi.mock('@/composables/useAlbumImageUpload', () => ({
  useAlbumImageUpload: () => ({
    loadingStates: ref({}),
    uploadStatus: ref({}),
    createSignedStorageUrlError: ref(null),
    createImageError: ref(null),
    handleMultipleFiles: vi.fn(),
    handleDrop: vi.fn(),
    createImageFromUrl,
  }),
}));
vi.mock('@/composables/useAlbumAutoSave', () => ({
  useAlbumAutoSave: () => ({
    isAutoSaving: ref(false),
    autoSaveSuccess: ref(false),
    updateDiscussionError: ref(null),
    debouncedAutoSave,
  }),
}));
vi.mock('@/composables/useImageMetadataAutoSave', () => ({
  useImageMetadataAutoSave: () => ({
    saveImageMetadata,
    isSavingImageMetadata: ref(false),
    imageMetadataError: ref(null),
  }),
}));
vi.mock('@/composables/useInstanceSetupStatus', () => ({
  useInstanceCapability: () => ({
    capability: uploadsCapability,
    available: uploadsAvailable,
    loading: uploadsLoading,
    error: uploadsError,
  }),
}));

const AlbumImageItemStub = {
  name: 'AlbumImageItem',
  props: ['image', 'index', 'isFirst', 'isLast'],
  emits: ['update-field', 'delete', 'move-up', 'move-down'],
  template: '<div class="image-item-stub" />',
};

const AlbumDropZoneStub = {
  name: 'AlbumDropZone',
  props: [
    'fileUploadAvailable',
    'fileUploadUnavailableMessage',
    'setupUrl',
    'compact',
    'selectedImageIds',
  ],
  emits: [
    'files-selected',
    'drop',
    'show-url-input',
    'show-existing-picker',
    'add-existing-image',
  ],
  template: '<div class="drop-zone-stub" />',
};

// The component calls focusInput/setError/reset on the form ref; expose them so
// optional-chaining calls don't blow up.
const AlbumUrlInputFormStub = {
  name: 'AlbumUrlInputForm',
  props: ['isCreating'],
  emits: ['submit', 'cancel'],
  methods: { focusInput() {}, setError() {}, reset() {} },
  template: '<div class="url-input-stub" />',
};

const AlbumExistingImagePickerStub = {
  name: 'AlbumExistingImagePicker',
  props: ['open', 'selectedImageIds', 'maxImages', 'initialTab'],
  emits: ['add-images', 'close'],
  template: '<div class="existing-image-picker-stub" />',
};

// The reusable-image picker stays closed until the user asks to reuse an image,
// so tests first request it via the drop zone.
const revealExistingPicker = async (
  wrapper: ReturnType<typeof mountEditor>,
  tab?: string
) => {
  wrapper.getComponent(AlbumDropZoneStub).vm.$emit('show-existing-picker', tab);
  await wrapper.vm.$nextTick();
};

const WarningModalStub = {
  name: 'WarningModal',
  props: ['open', 'title', 'body', 'loading', 'error'],
  emits: ['primary-button-click', 'close'],
  template: '<div class="warning-modal-stub" />',
};

const stubs = {
  AlbumImageItem: AlbumImageItemStub,
  AlbumDropZone: AlbumDropZoneStub,
  AlbumUrlInputForm: AlbumUrlInputFormStub,
  AlbumExistingImagePicker: AlbumExistingImagePickerStub,
  WarningModal: WarningModalStub,
  ErrorBanner: { props: ['text'], template: '<div />' },
  LoadingSpinner: { template: '<div />' },
};

const makeImage = (id: string) => ({
  id,
  url: `https://example.com/${id}.jpg`,
  alt: `alt-${id}`,
  caption: '',
  copyright: '',
});

const mountEditor = (
  images = [makeImage('a'), makeImage('b'), makeImage('c')],
  imageOrder = ['a', 'b', 'c'],
  props: Record<string, unknown> = {}
) =>
  mountWithDefaults(AlbumEditor, {
    props: { formValues: { album: { images, imageOrder } }, ...props },
    global: { stubs },
  });

const lastEmit = (wrapper: ReturnType<typeof mountEditor>) => {
  const calls = wrapper.emitted('updateFormValues');
  return (
    calls?.[calls.length - 1]?.[0] as {
      album: { images: { id: string }[]; imageOrder: string[] };
    }
  ).album;
};

const warningModal = (wrapper: ReturnType<typeof mountEditor>) =>
  wrapper.getComponent(WarningModalStub);

describe('AlbumEditor', () => {
  beforeEach(() => {
    usernameRef.value = 'alice';
    createImageFromUrl.mockReset();
    uploadsAvailable.value = true;
    uploadsCapability.value = {
      configured: true,
      enabled: true,
      requiredEnvVarsMissing: [],
      setupUrl: '/admin/setup#file-uploads',
      docsPath: '/self-hosting/uploads',
    };
    uploadsLoading.value = false;
    uploadsError.value = null;
    saveImageMetadata.mockReset();
    debouncedAutoSave.mockReset();
  });

  it('renders one image item per ordered image', () => {
    const wrapper = mountEditor();
    expect(wrapper.findAllComponents(AlbumImageItemStub)).toHaveLength(3);
  });

  it('disables direct file uploads but preserves album editing when storage is unavailable', () => {
    uploadsAvailable.value = false;
    uploadsCapability.value = {
      ...uploadsCapability.value!,
      configured: false,
      enabled: false,
    };

    const wrapper = mountEditor();

    expect(wrapper.getComponent(AlbumDropZoneStub).props()).toMatchObject({
      fileUploadAvailable: false,
      fileUploadUnavailableMessage:
        'File uploads are unavailable until file storage is configured.',
      setupUrl: '/admin/setup#file-uploads',
    });
  });

  it('reports an availability check failure without linking to instance setup', () => {
    uploadsAvailable.value = false;
    uploadsCapability.value = null;
    uploadsError.value = new Error('Not Authorised!');

    const wrapper = mountEditor();

    expect(wrapper.getComponent(AlbumDropZoneStub).props()).toMatchObject({
      fileUploadAvailable: false,
      fileUploadUnavailableMessage:
        'File upload availability could not be checked. Try refreshing the page.',
      setupUrl: '',
    });
  });

  it('emits the album without the deleted image', async () => {
    const wrapper = mountEditor();
    wrapper.findAllComponents(AlbumImageItemStub)[0].vm.$emit('delete');
    warningModal(wrapper).vm.$emit('primary-button-click');
    await flushPromises();
    expect(lastEmit(wrapper).images.map((i) => i.id)).toEqual(['b', 'c']);
  });

  it('opens a confirmation modal before removing an image', async () => {
    const wrapper = mountEditor();
    wrapper.findAllComponents(AlbumImageItemStub)[0].vm.$emit('delete');
    await wrapper.vm.$nextTick();
    expect(warningModal(wrapper).props('open')).toBe(true);
  });

  it('explains that removing the pointer keeps the original image', async () => {
    const wrapper = mountEditor();
    wrapper.findAllComponents(AlbumImageItemStub)[0].vm.$emit('delete');
    await wrapper.vm.$nextTick();
    expect(warningModal(wrapper).props()).toMatchObject({
      title: 'Remove this image from the album?',
      body: 'The original image will remain in the library, collections, and other albums.',
    });
  });

  it('uses the same relationship-only removal flow for another uploader', async () => {
    const wrapper = mountEditor(
      [
        {
          ...makeImage('a'),
          Uploader: { username: 'bob', displayName: 'Bob' },
        },
      ],
      ['a']
    );
    wrapper.findComponent(AlbumImageItemStub).vm.$emit('delete');
    warningModal(wrapper).vm.$emit('primary-button-click');
    await flushPromises();
    expect(lastEmit(wrapper).images).toEqual([]);
  });

  it('reorders imageOrder when an image moves up', () => {
    const wrapper = mountEditor();
    wrapper.findAllComponents(AlbumImageItemStub)[1].vm.$emit('move-up');
    expect(lastEmit(wrapper).imageOrder).toEqual(['b', 'a', 'c']);
  });

  it('reorders imageOrder when an image moves down', () => {
    const wrapper = mountEditor();
    wrapper.findAllComponents(AlbumImageItemStub)[0].vm.$emit('move-down');
    expect(lastEmit(wrapper).imageOrder).toEqual(['b', 'a', 'c']);
  });

  it('updates a field on the targeted image', () => {
    const wrapper = mountEditor();
    wrapper
      .findAllComponents(AlbumImageItemStub)[0]
      .vm.$emit('update-field', 'alt', 'new alt');
    const updated = lastEmit(wrapper).images.find((i) => i.id === 'a') as {
      alt: string;
    };
    expect(updated.alt).toBe('new alt');
  });

  it.each(['alt', 'caption', 'copyright'])(
    'saves an edited %s straight to the image with its other text fields',
    (field) => {
      const wrapper = mountEditor();
      wrapper
        .findAllComponents(AlbumImageItemStub)[0]
        .vm.$emit('update-field', field, 'new value');
      expect(saveImageMetadata).toHaveBeenCalledWith({
        imageId: 'a',
        metadata: {
          alt: 'alt-a',
          caption: '',
          copyright: '',
          [field]: 'new value',
        },
      });
    }
  );

  it('leaves image text-field edits out of the album save', () => {
    const wrapper = mountEditor();
    wrapper
      .findAllComponents(AlbumImageItemStub)[0]
      .vm.$emit('update-field', 'caption', 'new caption');
    expect(debouncedAutoSave).not.toHaveBeenCalled();
  });

  it('saves an image URL edit through the album save', () => {
    const wrapper = mountEditor();
    wrapper
      .findAllComponents(AlbumImageItemStub)[0]
      .vm.$emit('update-field', 'url', 'https://example.com/new.jpg');
    expect(debouncedAutoSave).toHaveBeenCalled();
  });

  it('adds an existing image from the picker', async () => {
    const wrapper = mountEditor();
    await revealExistingPicker(wrapper);
    wrapper
      .findComponent(AlbumExistingImagePickerStub)
      .vm.$emit('add-images', [makeImage('d')]);
    await flushPromises();
    expect(lastEmit(wrapper).imageOrder).toEqual(['a', 'b', 'c', 'd']);
  });

  it('does not auto-save picker changes when the enclosing form owns saving', async () => {
    const wrapper = mountEditor(undefined, undefined, { autoSave: false });
    await revealExistingPicker(wrapper);
    wrapper
      .findComponent(AlbumExistingImagePickerStub)
      .vm.$emit('add-images', [makeImage('d')]);
    await flushPromises();
    expect(debouncedAutoSave).not.toHaveBeenCalled();
  });

  it('adds several existing images from the picker in one update', async () => {
    const wrapper = mountEditor();
    await revealExistingPicker(wrapper);
    wrapper
      .findComponent(AlbumExistingImagePickerStub)
      .vm.$emit('add-images', [makeImage('d'), makeImage('e')]);
    await flushPromises();
    expect(lastEmit(wrapper).imageOrder).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('adds a recent upload chosen in the drop zone', async () => {
    const wrapper = mountEditor();
    wrapper
      .getComponent(AlbumDropZoneStub)
      .vm.$emit('add-existing-image', makeImage('d'));
    await flushPromises();
    expect(lastEmit(wrapper).imageOrder).toEqual(['a', 'b', 'c', 'd']);
  });

  it('switches the drop zone to its compact layout once the album has images', () => {
    const wrapper = mountEditor();
    expect(wrapper.getComponent(AlbumDropZoneStub).props('compact')).toBe(true);
  });

  it('does not add a duplicate existing image from the picker', async () => {
    const wrapper = mountEditor();
    await revealExistingPicker(wrapper);
    wrapper
      .findComponent(AlbumExistingImagePickerStub)
      .vm.$emit('add-images', [makeImage('a')]);
    await flushPromises();
    expect(wrapper.emitted('updateFormValues')).toBeUndefined();
  });

  describe('reorder guards', () => {
    it('ignores move-up on the first image', () => {
      const wrapper = mountEditor();
      wrapper.findAllComponents(AlbumImageItemStub)[0].vm.$emit('move-up');
      expect(wrapper.emitted('updateFormValues')).toBeUndefined();
    });

    it('ignores move-down on the last image', () => {
      const wrapper = mountEditor();
      wrapper.findAllComponents(AlbumImageItemStub)[2].vm.$emit('move-down');
      expect(wrapper.emitted('updateFormValues')).toBeUndefined();
    });
  });

  describe('URL input flow', () => {
    const showForm = async (wrapper: ReturnType<typeof mountEditor>) => {
      wrapper.findComponent(AlbumDropZoneStub).vm.$emit('show-url-input');
      await wrapper.vm.$nextTick();
    };

    it('reveals the URL form when the drop zone requests it', async () => {
      const wrapper = mountEditor();
      expect(wrapper.findComponent(AlbumUrlInputFormStub).exists()).toBe(false);
      await showForm(wrapper);
      expect(wrapper.findComponent(AlbumUrlInputFormStub).exists()).toBe(true);
    });

    it('hides the URL form on cancel', async () => {
      const wrapper = mountEditor();
      await showForm(wrapper);
      wrapper.findComponent(AlbumUrlInputFormStub).vm.$emit('cancel');
      await wrapper.vm.$nextTick();
      expect(wrapper.findComponent(AlbumUrlInputFormStub).exists()).toBe(false);
    });

    it('adds the created image and closes the form on a successful submit', async () => {
      createImageFromUrl.mockResolvedValue({
        id: 'd',
        url: 'https://example.com/d.jpg',
        alt: '',
        caption: '',
        copyright: '',
      });
      const wrapper = mountEditor();
      await showForm(wrapper);
      wrapper
        .findComponent(AlbumUrlInputFormStub)
        .vm.$emit('submit', 'https://example.com/d.jpg');
      await flushPromises();

      expect(lastEmit(wrapper).images.map((i) => i.id)).toContain('d');
      expect(wrapper.findComponent(AlbumUrlInputFormStub).exists()).toBe(false);
    });

    it('does not add an image when no username is set', async () => {
      usernameRef.value = '';
      const wrapper = mountEditor();
      await showForm(wrapper);
      wrapper
        .findComponent(AlbumUrlInputFormStub)
        .vm.$emit('submit', 'https://example.com/d.jpg');
      await flushPromises();

      expect(createImageFromUrl).not.toHaveBeenCalled();
      expect(wrapper.emitted('updateFormValues')).toBeUndefined();
    });

    it('keeps the form open when image creation fails', async () => {
      createImageFromUrl.mockResolvedValue(null);
      const wrapper = mountEditor();
      await showForm(wrapper);
      wrapper
        .findComponent(AlbumUrlInputFormStub)
        .vm.$emit('submit', 'https://example.com/d.jpg');
      await flushPromises();

      expect(wrapper.emitted('updateFormValues')).toBeUndefined();
      expect(wrapper.findComponent(AlbumUrlInputFormStub).exists()).toBe(true);
    });
  });

  describe('existing-image picker flow', () => {
    const picker = (wrapper: ReturnType<typeof mountEditor>) =>
      wrapper.getComponent(AlbumExistingImagePickerStub);

    it('keeps the library picker closed until the user requests it', () => {
      const wrapper = mountEditor();
      expect(picker(wrapper).props('open')).toBe(false);
    });

    it('opens the library picker when the drop zone requests it', async () => {
      const wrapper = mountEditor();
      await revealExistingPicker(wrapper);
      expect(picker(wrapper).props('open')).toBe(true);
    });

    it('opens the library picker on the tab the drop zone asked for', async () => {
      const wrapper = mountEditor();
      await revealExistingPicker(wrapper, 'collections');
      expect(picker(wrapper).props('initialTab')).toBe('collections');
    });

    it('defaults to the uploads tab', async () => {
      const wrapper = mountEditor();
      await revealExistingPicker(wrapper);
      expect(picker(wrapper).props('initialTab')).toBe('uploads');
    });

    it('closes the library picker on close', async () => {
      const wrapper = mountEditor();
      await revealExistingPicker(wrapper);
      picker(wrapper).vm.$emit('close');
      await wrapper.vm.$nextTick();
      expect(picker(wrapper).props('open')).toBe(false);
    });

    it('closes the library picker after images are added', async () => {
      const wrapper = mountEditor();
      await revealExistingPicker(wrapper);
      picker(wrapper).vm.$emit('add-images', [makeImage('d')]);
      await wrapper.vm.$nextTick();
      expect(picker(wrapper).props('open')).toBe(false);
    });
  });
});
