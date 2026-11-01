import { ref, computed, onBeforeUnmount, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { UpdateDiscussionWithChannelConnectionsDocument } from '@/__generated__/operations';
import type { PresentationAlbum } from '@/types/DiscussionPresentation';
import { buildAlbumUpdateInput, type AlbumFormData, type ExistingAlbumImage } from '@/utils/albumUpdateInput';

type UseAlbumAutoSaveParams = {
  discussionId: MaybeRefOrGetter<string | undefined>;
  existingAlbum: MaybeRefOrGetter<PresentationAlbum | null | undefined>;
  getAlbumData: () => NonNullable<AlbumFormData>;
};

/** Serializes debounced saves and rejects completion state from an old route. */
export function useAlbumAutoSave(params: UseAlbumAutoSaveParams) {
  const { mutate: updateDiscussion, loading: mutationLoading, error: mutationError } = useMutation(UpdateDiscussionWithChannelConnectionsDocument);
  const generation = ref(0);
  const requestScope = ref(-1);
  const unconfirmedSave = ref<Error | null>(null);
  const isAutoSaving = computed(() => requestScope.value === generation.value && mutationLoading.value);
  const updateDiscussionError = computed(() => requestScope.value === generation.value ? mutationError.value ?? unconfirmedSave.value : null);
  const autoSaveSuccess = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let successTimer: ReturnType<typeof setTimeout> | undefined;
  let active = false;
  let queued = false;
  let stopped = false;
  let savedBaseline: { images: ExistingAlbumImage[]; imageOrder: string[] } | undefined;

  watch(() => toValue(params.discussionId), () => {
    generation.value++;
    if (timer) clearTimeout(timer);
    if (successTimer) clearTimeout(successTimer);
    savedBaseline = undefined;
    queued = false;
    autoSaveSuccess.value = false;
    unconfirmedSave.value = null;
  });

  const performAutoSave = async (): Promise<void> => {
    const discussionId = toValue(params.discussionId);
    if (!discussionId || stopped) return;
    if (active) { queued = true; return; }
    const scope = generation.value;
    const existing = toValue(params.existingAlbum);
    const data = params.getAlbumData();
    const snapshot = {
      images: (data.images ?? []).map((image) => ({ ...image })),
      imageOrder: [...(data.imageOrder ?? [])],
    };
    const album = buildAlbumUpdateInput({
      albumData: snapshot,
      existingImages: savedBaseline?.images ?? existing?.Images ?? [],
      existingImageOrder: savedBaseline?.imageOrder ?? existing?.imageOrder,
    });
    if (!album) return;
    unconfirmedSave.value = null;
    active = true;
    requestScope.value = scope;
    autoSaveSuccess.value = false;
    try {
      const result = await updateDiscussion({ where: { id: { eq: discussionId } }, updateDiscussionInput: {}, album });
      if (!stopped && generation.value === scope && toValue(params.discussionId) === discussionId && result?.data?.updateDiscussionWithChannelConnections) {
        savedBaseline = { images: snapshot.images, imageOrder: album.imageIds.map(String) };
        autoSaveSuccess.value = true;
        successTimer = setTimeout(() => { autoSaveSuccess.value = false; }, 2000);
      } else if (!stopped && generation.value === scope) {
        unconfirmedSave.value = new Error('The album save was not confirmed. Please retry.');
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      active = false;
      if (queued && !stopped) { queued = false; await performAutoSave(); }
    }
  };

  const debouncedAutoSave = () => {
    if (!toValue(params.discussionId) || stopped) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { void performAutoSave(); }, 500);
  };
  onBeforeUnmount(() => {
    stopped = true;
    generation.value++;
    if (timer) clearTimeout(timer);
    if (successTimer) clearTimeout(successTimer);
  });
  return { isAutoSaving, autoSaveSuccess, updateDiscussionError, debouncedAutoSave, performAutoSave };
}
