import { defineStore } from 'pinia';
import { ref } from 'vue';

export type AllowedItemType =
  | 'discussion'
  | 'comment'
  | 'image'
  | 'channel'
  | 'download';

export const useAddToListModalStore = defineStore('addToListModal', () => {
  const isOpen = ref(false);
  const itemId = ref('');
  const itemType = ref<AllowedItemType>('discussion');
  const isAlreadyFavorite = ref(false);

  const open = (payload: {
    itemId: string;
    itemType: AllowedItemType;
    isAlreadyFavorite?: boolean;
  }) => {
    itemId.value = payload.itemId;
    itemType.value = payload.itemType;
    isAlreadyFavorite.value = Boolean(payload.isAlreadyFavorite);
    isOpen.value = true;
  };

  const close = () => {
    isOpen.value = false;
    itemId.value = '';
    itemType.value = 'discussion';
    isAlreadyFavorite.value = false;
  };

  return {
    isOpen,
    itemId,
    itemType,
    isAlreadyFavorite,
    open,
    close,
  };
});
