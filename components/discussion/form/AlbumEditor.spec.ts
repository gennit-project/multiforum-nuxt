import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import AlbumEditor from '@/components/discussion/form/AlbumEditor.vue';

// Hoisted, controllable test seams: username (for the no-username branch) and
// the URL-image creation spy (for the submit success/failure branches).
const { usernameRef, createImageFromUrl } = vi.hoisted(() => ({
  usernameRef: { value: 'alice' as string },
  createImageFromUrl: vi.fn(),
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
    debouncedAutoSave: vi.fn(),
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
  emits: ['files-selected', 'drop', 'show-url-input'],
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

const stubs = {
  AlbumImageItem: AlbumImageItemStub,
  AlbumDropZone: AlbumDropZoneStub,
  AlbumUrlInputForm: AlbumUrlInputFormStub,
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
  imageOrder = ['a', 'b', 'c']
) =>
  mountWithDefaults(AlbumEditor, {
    props: { formValues: { album: { images, imageOrder } } },
    global: { stubs },
  });

const lastEmit = (wrapper: ReturnType<typeof mountEditor>) => {
  const calls = wrapper.emitted('updateFormValues');
  return (calls?.[calls.length - 1]?.[0] as { album: { images: { id: string }[]; imageOrder: string[] } }).album;
};

describe('AlbumEditor', () => {
  beforeEach(() => {
    usernameRef.value = 'alice';
    createImageFromUrl.mockReset();
  });

  it('renders one image item per ordered image', () => {
    const wrapper = mountEditor();
    expect(wrapper.findAllComponents(AlbumImageItemStub)).toHaveLength(3);
  });

  it('emits the album without the deleted image', async () => {
    const wrapper = mountEditor();
    wrapper.findAllComponents(AlbumImageItemStub)[0].vm.$emit('delete');
    expect(lastEmit(wrapper).images.map((i) => i.id)).toEqual(['b', 'c']);
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
    wrapper.findAllComponents(AlbumImageItemStub)[0].vm.$emit('update-field', 'alt', 'new alt');
    const updated = lastEmit(wrapper).images.find((i) => i.id === 'a') as { alt: string };
    expect(updated.alt).toBe('new alt');
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
      wrapper.findComponent(AlbumUrlInputFormStub).vm.$emit('submit', 'https://example.com/d.jpg');
      await flushPromises();

      expect(lastEmit(wrapper).images.map((i) => i.id)).toContain('d');
      expect(wrapper.findComponent(AlbumUrlInputFormStub).exists()).toBe(false);
    });

    it('does not add an image when no username is set', async () => {
      usernameRef.value = '';
      const wrapper = mountEditor();
      await showForm(wrapper);
      wrapper.findComponent(AlbumUrlInputFormStub).vm.$emit('submit', 'https://example.com/d.jpg');
      await flushPromises();

      expect(createImageFromUrl).not.toHaveBeenCalled();
      expect(wrapper.emitted('updateFormValues')).toBeUndefined();
    });

    it('keeps the form open when image creation fails', async () => {
      createImageFromUrl.mockResolvedValue(null);
      const wrapper = mountEditor();
      await showForm(wrapper);
      wrapper.findComponent(AlbumUrlInputFormStub).vm.$emit('submit', 'https://example.com/d.jpg');
      await flushPromises();

      expect(wrapper.emitted('updateFormValues')).toBeUndefined();
      expect(wrapper.findComponent(AlbumUrlInputFormStub).exists()).toBe(true);
    });
  });
});
