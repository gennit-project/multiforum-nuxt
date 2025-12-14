<script setup lang="ts">
import { computed } from 'vue';
import AddToListPopover from '@/components/collection/AddToListPopover.vue';
import { useAddToListModalStore } from '@/stores/addToListModalStore';

const modalStore = useAddToListModalStore();

const isVisible = computed(() => modalStore.isOpen && !!modalStore.itemId);

const handleClose = () => {
  modalStore.close();
};
</script>

<template>
  <AddToListPopover
    v-if="isVisible"
    :item-id="modalStore.itemId"
    :item-type="modalStore.itemType"
    :is-visible="isVisible"
    :is-already-favorite="modalStore.isAlreadyFavorite"
    variant="modal"
    @close="handleClose"
  />
</template>
