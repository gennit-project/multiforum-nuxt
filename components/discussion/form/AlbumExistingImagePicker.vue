<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue';
import { useUsername } from '@/composables/useAuthState';
import AlbumReusableUserImagesTab from './AlbumReusableUserImagesTab.vue';
import AlbumReusableCollectionsTab from './AlbumReusableCollectionsTab.vue';
import type { LibraryTabKey, ReusableImage } from './reusableImageTypes';

const props = withDefaults(
  defineProps<{
    open: boolean;
    selectedImageIds: string[];
    maxImages: number;
    initialTab?: LibraryTabKey;
  }>(),
  { initialTab: 'uploads' }
);

const emit = defineEmits<{
  addImages: [images: ReusableImage[]];
  close: [];
}>();

const usernameVar = useUsername();
const hasUsername = computed(() => Boolean(usernameVar.value));

const searchTerm = ref('');
const activeTab = ref<LibraryTabKey>(props.initialTab);
// Images ticked in this session of the modal, in the order they were picked.
const pendingImages = ref<Map<string, ReusableImage>>(new Map());

const tabs: Array<{ key: LibraryTabKey; label: string }> = [
  { key: 'uploads', label: 'Uploads' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'collections', label: 'Collections' },
];

const searchPlaceholder = computed(() =>
  activeTab.value === 'collections'
    ? 'Search collections and their images'
    : 'Search by caption, alt text, URL, or image ID'
);

const pendingImageIds = computed(() => [...pendingImages.value.keys()]);
const pendingCount = computed(() => pendingImages.value.size);
const totalAfterAdd = computed(
  () => props.selectedImageIds.length + pendingCount.value
);
// Once the picks would fill the album, other images stop being selectable.
const isLimitReached = computed(() => totalAfterAdd.value >= props.maxImages);

const summary = computed(() =>
  pendingCount.value === 0
    ? 'Nothing selected'
    : `${pendingCount.value} selected · ${totalAfterAdd.value} of ${props.maxImages} in album`
);

const addButtonLabel = computed(() =>
  pendingCount.value === 0 ? 'Add to album' : `Add ${pendingCount.value} to album`
);

// Start fresh each time the modal opens, on the tab the caller asked for.
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return;
    pendingImages.value = new Map();
    searchTerm.value = '';
    activeTab.value = props.initialTab;
  }
);

const toggleImage = (image: ReusableImage) => {
  const next = new Map(pendingImages.value);
  if (next.has(image.id)) {
    next.delete(image.id);
  } else {
    next.set(image.id, image);
  }
  pendingImages.value = next;
};

const addSelected = () => {
  if (pendingCount.value === 0) return;
  emit('addImages', [...pendingImages.value.values()]);
};
</script>

<template>
  <ClientOnly>
    <TransitionRoot as="template" :show="open">
      <Dialog
        as="div"
        class="relative"
        style="z-index: 1000"
        data-testid="album-library-modal"
        @close="emit('close')"
      >
        <TransitionChild
          as="template"
          enter="ease-out duration-200"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-150"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-500/75" />
        </TransitionChild>

        <div class="fixed inset-0 z-10 flex items-end justify-center sm:items-center sm:p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-200"
            enter-from="translate-y-8 opacity-0 sm:translate-y-0 sm:scale-95"
            enter-to="translate-y-0 opacity-100 sm:scale-100"
            leave="ease-in duration-150"
            leave-from="translate-y-0 opacity-100 sm:scale-100"
            leave-to="translate-y-8 opacity-0 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel
              class="flex h-[86vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:h-auto sm:max-h-[85vh] sm:max-w-3xl sm:rounded-xl dark:bg-gray-800"
            >
              <div
                class="mx-auto mt-2 h-1 w-9 rounded-full bg-gray-300 sm:hidden dark:bg-gray-600"
                aria-hidden="true"
              />
              <div class="flex items-start justify-between gap-3 px-4 pt-3 pb-1 sm:px-5 sm:pt-4">
                <div>
                  <DialogTitle
                    as="h3"
                    class="text-base font-semibold text-gray-900 dark:text-white"
                  >
                    Choose from your library
                  </DialogTitle>
                  <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
                    Select as many as you like. Original uploader credit is kept.
                  </p>
                </div>
                <button
                  type="button"
                  class="-mt-1 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:ring-2 focus:ring-orange-500/40 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                  aria-label="Close library"
                  @click="emit('close')"
                >
                  <svg
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p
                v-if="!hasUsername"
                class="px-4 py-6 text-sm text-gray-600 sm:px-5 dark:text-gray-300"
              >
                Sign in to reuse images from your uploads, favorites, and collections.
              </p>

              <template v-else>
                <div
                  class="flex gap-1 border-b border-gray-200 px-3 sm:px-4 dark:border-gray-700"
                  role="tablist"
                  aria-label="Reusable image sources"
                >
                  <button
                    v-for="tab in tabs"
                    :key="tab.key"
                    type="button"
                    role="tab"
                    :aria-selected="activeTab === tab.key"
                    :class="[
                      'px-3 py-2.5 text-sm font-medium whitespace-nowrap focus:ring-2 focus:ring-orange-500/30 focus:outline-none',
                      activeTab === tab.key
                        ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white',
                    ]"
                    @click="activeTab = tab.key"
                  >
                    {{ tab.label }}
                  </button>
                </div>

                <div class="px-4 pt-3 sm:px-5">
                  <label
                    class="sr-only"
                    for="existing-image-search"
                  >
                    Search reusable images
                  </label>
                  <input
                    id="existing-image-search"
                    v-model="searchTerm"
                    type="search"
                    class="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 focus:outline-none sm:h-10 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    :placeholder="searchPlaceholder"
                  >
                </div>

                <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-3 sm:px-5">
                  <AlbumReusableUserImagesTab
                    v-if="activeTab === 'uploads'"
                    key="uploads"
                    source="uploads"
                    :search-term="searchTerm"
                    :selected-image-ids="selectedImageIds"
                    :pending-image-ids="pendingImageIds"
                    :is-limit-reached="isLimitReached"
                    @toggle-image="toggleImage"
                  />
                  <AlbumReusableUserImagesTab
                    v-else-if="activeTab === 'favorites'"
                    key="favorites"
                    source="favorites"
                    :search-term="searchTerm"
                    :selected-image-ids="selectedImageIds"
                    :pending-image-ids="pendingImageIds"
                    :is-limit-reached="isLimitReached"
                    @toggle-image="toggleImage"
                  />
                  <AlbumReusableCollectionsTab
                    v-else
                    :search-term="searchTerm"
                    :selected-image-ids="selectedImageIds"
                    :pending-image-ids="pendingImageIds"
                    :is-limit-reached="isLimitReached"
                    @toggle-image="toggleImage"
                  />
                </div>

                <div
                  class="flex flex-col gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-gray-700 dark:bg-gray-900/40"
                >
                  <p
                    class="text-center text-xs text-gray-600 sm:text-left sm:text-sm dark:text-gray-300"
                    data-testid="album-library-summary"
                    aria-live="polite"
                  >
                    {{ summary }}
                  </p>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="hidden rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-orange-500 focus:outline-none sm:inline-flex dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                      @click="emit('close')"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      class="h-12 w-full rounded-full bg-orange-600 px-5 text-base font-medium text-white hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 sm:h-10 sm:w-auto sm:text-sm dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
                      data-testid="album-library-add-button"
                      :disabled="pendingCount === 0"
                      @click="addSelected"
                    >
                      {{ addButtonLabel }}
                    </button>
                  </div>
                </div>
              </template>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>
  </ClientOnly>
</template>
