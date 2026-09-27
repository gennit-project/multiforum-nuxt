import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useImageMetadataAutoSave } from '@/composables/useImageMetadataAutoSave';

const { mockMutate } = vi.hoisted(() => ({ mockMutate: vi.fn() }));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: mockMutate,
    loading: ref(false),
    error: ref(null),
  }),
}));

vi.mock('@/graphQLData/discussion/mutations', () => ({
  UPDATE_IMAGE_METADATA: Symbol('UPDATE_IMAGE_METADATA'),
}));

// The composable flushes pending saves on unmount, so it needs a component
// lifecycle; this host only calls it and exposes the result.
const mountComposable = () => {
  let api!: ReturnType<typeof useImageMetadataAutoSave>;
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useImageMetadataAutoSave();
        return () => h('div');
      },
    })
  );
  return { api, wrapper };
};

const metadata = (caption: string) => ({
  alt: 'An octopus',
  caption,
  copyright: 'H. Zell',
});

describe('useImageMetadataAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMutate.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits for typing to pause before saving', () => {
    const { api } = mountComposable();
    api.saveImageMetadata({ imageId: 'img-1', metadata: metadata('I') });
    vi.advanceTimersByTime(400);
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('saves only the latest values once typing pauses', () => {
    const { api } = mountComposable();
    api.saveImageMetadata({ imageId: 'img-1', metadata: metadata('I') });
    api.saveImageMetadata({ imageId: 'img-1', metadata: metadata('Image') });
    vi.advanceTimersByTime(500);
    expect(mockMutate.mock.calls).toEqual([
      [{ imageId: 'img-1', ...metadata('Image') }],
    ]);
  });

  it('saves each image separately', () => {
    const { api } = mountComposable();
    api.saveImageMetadata({ imageId: 'img-1', metadata: metadata('one') });
    api.saveImageMetadata({ imageId: 'img-2', metadata: metadata('two') });
    vi.advanceTimersByTime(500);
    expect(mockMutate.mock.calls).toEqual([
      [{ imageId: 'img-1', ...metadata('one') }],
      [{ imageId: 'img-2', ...metadata('two') }],
    ]);
  });

  it('saves pending edits immediately when the form unmounts', () => {
    const { api, wrapper } = mountComposable();
    api.saveImageMetadata({ imageId: 'img-1', metadata: metadata('Image') });
    wrapper.unmount();
    expect(mockMutate).toHaveBeenCalledWith({
      imageId: 'img-1',
      ...metadata('Image'),
    });
  });

  it('does not save twice when the timer fires after an unmount flush', () => {
    const { api, wrapper } = mountComposable();
    api.saveImageMetadata({ imageId: 'img-1', metadata: metadata('Image') });
    wrapper.unmount();
    vi.advanceTimersByTime(500);
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });
});
