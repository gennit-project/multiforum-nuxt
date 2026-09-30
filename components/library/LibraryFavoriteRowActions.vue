<script setup lang="ts">
import { computed } from 'vue';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { useMutation } from '@vue/apollo-composable';
import { useUsername } from '@/composables/useAuthState';
import { useAddToListModalStore } from '@/stores/addToListModalStore';
import { useToastStore } from '@/stores/toastStore';
import {
  REMOVE_FAVORITE_CHANNEL,
  REMOVE_FAVORITE_COMMENT,
  REMOVE_FAVORITE_DISCUSSION,
  REMOVE_FAVORITE_IMAGE,
} from '@/graphQLData/user/mutations';
import type { LibraryFavoriteKind } from '@/types/library';

const props = defineProps<{
  itemId: string;
  itemKind: LibraryFavoriteKind;
  itemTitle: string;
}>();

const emit = defineEmits<{
  removed: [itemId: string];
}>();

const username = useUsername();
const modalStore = useAddToListModalStore();
const toastStore = useToastStore();

const {
  mutate: removeDiscussion,
  loading: removingDiscussion,
  onDone: onDiscussionRemoved,
  onError: onDiscussionRemoveError,
} = useMutation(REMOVE_FAVORITE_DISCUSSION);
const {
  mutate: removeComment,
  loading: removingComment,
  onDone: onCommentRemoved,
  onError: onCommentRemoveError,
} = useMutation(REMOVE_FAVORITE_COMMENT);
const {
  mutate: removeImage,
  loading: removingImage,
  onDone: onImageRemoved,
  onError: onImageRemoveError,
} = useMutation(REMOVE_FAVORITE_IMAGE);
const {
  mutate: removeChannel,
  loading: removingChannel,
  onDone: onChannelRemoved,
  onError: onChannelRemoveError,
} = useMutation(REMOVE_FAVORITE_CHANNEL);

const collectionItemType = computed(() =>
  props.itemKind === 'download' ? 'download' : props.itemKind
);

const isRemoving = computed(
  () =>
    removingDiscussion.value ||
    removingComment.value ||
    removingImage.value ||
    removingChannel.value
);

const openCollectionPicker = () => {
  modalStore.open({
    itemId: props.itemId,
    itemType: collectionItemType.value,
    isAlreadyFavorite: true,
  });
};

const handleRemoved = () => {
  toastStore.showToast(`Removed “${props.itemTitle}” from favorites.`);
  emit('removed', props.itemId);
};

const handleRemoveError = () => {
  toastStore.showToast(
    `Could not remove “${props.itemTitle}” from favorites.`,
    'error'
  );
};

onDiscussionRemoved(handleRemoved);
onCommentRemoved(handleRemoved);
onImageRemoved(handleRemoved);
onChannelRemoved(handleRemoved);
onDiscussionRemoveError(handleRemoveError);
onCommentRemoveError(handleRemoveError);
onImageRemoveError(handleRemoveError);
onChannelRemoveError(handleRemoveError);

const removeFromFavorites = () => {
  if (isRemoving.value || !username.value) return;

  if (props.itemKind === 'channel') {
    removeChannel({ channel: props.itemId, username: username.value });
  } else if (props.itemKind === 'comment') {
    removeComment({ commentId: props.itemId, username: username.value });
  } else if (props.itemKind === 'image') {
    removeImage({ imageId: props.itemId, username: username.value });
  } else {
    removeDiscussion({
      discussionId: props.itemId,
      username: username.value,
    });
  }
};
</script>

<template>
  <Menu as="div" class="relative">
    <MenuButton
      class="hover:text-brand-600 focus:ring-brand-500/30 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 focus:ring-2 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      :aria-label="`Actions for ${itemTitle}`"
    >
      <svg
        class="h-5 w-5"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="5" cy="12" r="1.8" />
        <circle cx="12" cy="12" r="1.8" />
        <circle cx="19" cy="12" r="1.8" />
      </svg>
    </MenuButton>

    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="scale-95 opacity-0"
      enter-to-class="scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="scale-100 opacity-100"
      leave-to-class="scale-95 opacity-0"
    >
      <MenuItems
        class="absolute right-0 z-30 mt-1 w-60 origin-top-right overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl focus:outline-none dark:border-gray-700 dark:bg-gray-900"
      >
        <MenuItem v-slot="{ active, close }">
          <button
            type="button"
            class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-gray-800 dark:text-gray-100"
            :class="active ? 'bg-gray-100 dark:bg-gray-800' : ''"
            @click="
              openCollectionPicker();
              close();
            "
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <path
                d="M4 7h16M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
              />
              <path d="M12 10v6M9 13h6" />
            </svg>
            Add to collection
          </button>
        </MenuItem>
        <MenuItem v-slot="{ active }">
          <button
            type="button"
            class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-red-600 disabled:cursor-wait disabled:opacity-60 dark:text-red-400"
            :class="active ? 'bg-red-50 dark:bg-red-950/30' : ''"
            :disabled="isRemoving"
            @click="removeFromFavorites"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14" />
            </svg>
            {{ isRemoving ? 'Removing…' : 'Remove from favorites' }}
          </button>
        </MenuItem>
      </MenuItems>
    </transition>
  </Menu>
</template>
