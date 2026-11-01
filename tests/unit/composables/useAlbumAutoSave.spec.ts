import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, ref, nextTick } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { useAlbumAutoSave } from '@/composables/useAlbumAutoSave';
const mockMutate = vi.fn();
vi.mock('@vue/apollo-composable', () => ({ useMutation: () => ({ mutate: mockMutate, error: ref(null), loading: ref(false) }) }));
const saved = { data: { updateDiscussionWithChannelConnections: { id: 'd1' } } };
const wrappers: ReturnType<typeof mount>[] = [];
function setup() {
  const id = ref<string | undefined>('d1');
  const data = ref({ images: [{ id: 'a' }], imageOrder: ['a'] });
  let api: ReturnType<typeof useAlbumAutoSave> | undefined;
  const wrapper = mount(defineComponent({ setup() {
    api = useAlbumAutoSave({ discussionId: id, existingAlbum: null, getAlbumData: () => data.value });
    return () => null;
  } }));
  wrappers.push(wrapper);
  if (!api) throw new Error('setup did not run');
  return { api, id, data, wrapper };
}
beforeEach(() => { vi.useFakeTimers(); mockMutate.mockReset().mockResolvedValue(saved); });
afterEach(() => { wrappers.splice(0).forEach((wrapper) => wrapper.unmount()); vi.useRealTimers(); });
describe('typed album autosave', () => {
  it('sends complete membership through the explicit album argument', async () => {
    const { api } = setup(); await api.performAutoSave();
    expect(mockMutate).toHaveBeenCalledWith({ where: { id: { eq: 'd1' } }, updateDiscussionInput: {}, album: { imageIds: ['a'] } });
  });
  it('does not submit without a discussion ID', async () => {
    const { api, id } = setup(); id.value = undefined; await nextTick(); await api.performAutoSave();
    expect(mockMutate).not.toHaveBeenCalled();
  });
  it('coalesces repeated debounce requests', async () => {
    const { api } = setup(); api.debouncedAutoSave(); api.debouncedAutoSave(); await vi.advanceTimersByTimeAsync(500);
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });
  it('does not repeat an unchanged successful save', async () => {
    const { api } = setup(); await api.performAutoSave(); await api.performAutoSave();
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });
  it('does not acknowledge a null result as persisted', async () => {
    mockMutate.mockResolvedValue({ data: { updateDiscussionWithChannelConnections: null } });
    const { api } = setup(); await api.performAutoSave();
    expect(api.autoSaveSuccess.value).toBe(false);
  });
  it('keeps failed changes retryable', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockMutate.mockRejectedValueOnce(new Error('permission denied'));
    const { api } = setup(); await api.performAutoSave(); await api.performAutoSave(); spy.mockRestore();
    expect(mockMutate).toHaveBeenCalledTimes(2);
  });
  it('cancels a pending debounce after navigation', async () => {
    const { api, id } = setup(); api.debouncedAutoSave(); id.value = 'd2'; await nextTick(); await vi.advanceTimersByTimeAsync(500);
    expect(mockMutate).not.toHaveBeenCalled();
  });
  it('ignores completion from the previous discussion', async () => {
    let finish: ((value: typeof saved) => void) | undefined;
    mockMutate.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const { api, id } = setup(); const pending = api.performAutoSave(); id.value = 'd2'; await nextTick(); finish?.(saved); await pending;
    expect(api.autoSaveSuccess.value).toBe(false);
  });
  it('serializes pending changes using the newest snapshot', async () => {
    let finish: ((value: typeof saved) => void) | undefined;
    mockMutate.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const { api, data } = setup(); const pending = api.performAutoSave(); data.value = { images: [{ id: 'b' }], imageOrder: ['b'] }; await api.performAutoSave(); finish?.(saved); await pending; await flushPromises();
    expect(mockMutate.mock.calls.map(([variables]) => variables.album.imageIds)).toEqual([['a'], ['b']]);
  });
  it('cancels a debounce on unmount', async () => {
    const { api, wrapper } = setup(); api.debouncedAutoSave(); wrapper.unmount(); await vi.advanceTimersByTimeAsync(500);
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
