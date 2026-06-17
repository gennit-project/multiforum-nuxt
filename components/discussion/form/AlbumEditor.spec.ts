import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import AlbumEditor from '@/components/discussion/form/AlbumEditor.vue';

vi.mock('@/cache', () => ({ usernameVar: { value: 'alice' } }));
vi.mock('@/composables/useAlbumImageUpload', () => ({
  useAlbumImageUpload: () => ({
    loadingStates: ref({}),
    uploadStatus: ref({}),
    createSignedStorageUrlError: ref(null),
    createImageError: ref(null),
    handleMultipleFiles: vi.fn(),
    handleDrop: vi.fn(),
    createImageFromUrl: vi.fn(),
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

const stubs = {
  AlbumImageItem: AlbumImageItemStub,
  AlbumDropZone: { template: '<div class="drop-zone-stub" />' },
  AlbumUrlInputForm: { template: '<div />' },
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
});
