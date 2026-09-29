<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useUsername } from '@/composables/useAuthState';
import AlbumRecentUploadsStrip from './AlbumRecentUploadsStrip.vue';
import type { LibraryTabKey, ReusableImage } from './reusableImageTypes';

const props = withDefaults(
  defineProps<{
    isLimitReached: boolean;
    maxImages: number;
    compact?: boolean;
    selectedImageIds?: string[];
    fileUploadAvailable?: boolean;
    fileUploadUnavailableMessage?: string;
    setupUrl?: string;
  }>(),
  {
    compact: false,
    selectedImageIds: () => [],
    fileUploadAvailable: true,
    fileUploadUnavailableMessage: '',
    setupUrl: '',
  }
);

const emit = defineEmits<{
  (e: 'files-selected', files: FileList): void;
  (e: 'drop', event: DragEvent): void;
  (e: 'show-url-input'): void;
  (e: 'show-existing-picker', tab?: LibraryTabKey): void;
  (e: 'add-existing-image', image: ReusableImage): void;
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);

const selectFiles = (event?: Event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!props.fileUploadAvailable) return;

  if (props.isLimitReached) {
    alert(`You've reached the maximum limit of ${props.maxImages} images.`);
    return;
  }

  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const handleFileInputChange = (event: Event) => {
  if (!props.fileUploadAvailable) return;

  const input = event.target as HTMLInputElement;
  if (!input?.files?.length) return;

  emit('files-selected', input.files);

  // Reset the input so user can re-upload the same file if needed
  input.value = '';
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  if (!props.fileUploadAvailable) return;
  emit('drop', event);
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
};

const handleShowUrlInput = () => {
  if (props.isLimitReached) {
    alert(`You've reached the maximum limit of ${props.maxImages} images.`);
    return;
  }
  emit('show-url-input');
};

const handleShowExistingPicker = (tab?: LibraryTabKey) => {
  if (props.isLimitReached) {
    alert(`You've reached the maximum limit of ${props.maxImages} images.`);
    return;
  }
  emit('show-existing-picker', tab);
};

const usernameVar = useUsername();
const isSignedIn = computed(() => Boolean(usernameVar.value));

const icons = {
  upload:
    'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5',
  library:
    'm2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z',
  link: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244',
};

// Library gets equal billing with the other sources so it is obvious an album
// can be built from images the user already has.
const sources = computed(() => [
  {
    key: 'upload',
    title: 'Upload files',
    compactTitle: 'Upload',
    subtitle: 'Choose files or drag and drop',
    icon: icons.upload,
    disabled: !props.fileUploadAvailable,
    highlight: false,
    onClick: selectFiles,
  },
  {
    key: 'library',
    title: 'From your library',
    compactTitle: 'Library',
    subtitle: 'Uploads, favorites, and collections',
    icon: icons.library,
    disabled: false,
    highlight: true,
    onClick: () => handleShowExistingPicker(),
  },
  {
    key: 'link',
    title: 'Paste a link',
    compactTitle: 'Link',
    subtitle: 'Use an image from the web',
    icon: icons.link,
    disabled: false,
    highlight: false,
    onClick: handleShowUrlInput,
  },
]);
</script>

<template>
  <div
    v-if="!isLimitReached"
    class="my-3 rounded-md border-2 border-dotted border-gray-400 p-3 sm:p-4"
    :class="compact ? '' : 'sm:p-5'"
    @drop="handleDrop"
    @dragover="handleDragOver"
  >
    <template v-if="compact">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <p class="text-xs text-gray-600 sm:text-sm dark:text-gray-300">
          Add more
        </p>
        <div class="grid grid-cols-3 gap-2 sm:flex">
          <button
            v-for="source in sources"
            :key="source.key"
            type="button"
            class="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:flex-row sm:gap-2 sm:rounded-full sm:text-sm"
            :class="
              source.highlight
                ? 'border-orange-500 bg-orange-50 text-orange-800 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-950/70'
                : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
            "
            :data-testid="`album-source-${source.key}`"
            :disabled="source.disabled"
            @click="source.onClick"
          >
            <svg
              class="h-5 w-5 shrink-0 sm:h-4 sm:w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" :d="source.icon" />
            </svg>
            {{ source.compactTitle }}
          </button>
        </div>
      </div>
    </template>

    <template v-else>
      <p class="mb-3 text-sm text-gray-600 dark:text-gray-300">
        {{
          fileUploadAvailable
            ? 'Build your album from new uploads or images you already have.'
            : 'Build your album from images you already have or a link.'
        }}
      </p>
      <p
        v-if="fileUploadUnavailableMessage"
        class="mb-3 text-xs text-amber-800 dark:text-amber-200"
      >
        {{ fileUploadUnavailableMessage }}
        <NuxtLink
          v-if="setupUrl"
          :to="setupUrl"
          class="font-medium underline"
        >
          Open instance setup
        </NuxtLink>
      </p>

      <div class="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-3">
        <button
          v-for="source in sources"
          :key="source.key"
          type="button"
          class="flex min-h-14 items-center gap-3 rounded-xl border bg-white p-3 text-left transition-colors focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:flex-col sm:items-start sm:gap-1.5 sm:p-4 dark:bg-gray-800"
          :class="
            source.highlight
              ? 'border-2 border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30'
              : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50 dark:border-gray-600 dark:hover:bg-gray-700'
          "
          :data-testid="`album-source-${source.key}`"
          :disabled="source.disabled"
          @click="source.onClick"
        >
          <svg
            class="h-6 w-6 shrink-0 text-orange-600 dark:text-orange-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" :d="source.icon" />
          </svg>
          <span class="min-w-0 flex-1 sm:flex-none">
            <span class="block text-[15px] font-medium text-gray-900 dark:text-white">
              {{ source.title }}
            </span>
            <span class="block text-xs text-gray-600 dark:text-gray-300">
              {{ source.subtitle }}
            </span>
          </span>
          <svg
            v-if="source.key === 'library'"
            class="h-4 w-4 shrink-0 text-gray-400 sm:hidden"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <div
        v-if="isSignedIn"
        class="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700"
      >
        <AlbumRecentUploadsStrip
          :selected-image-ids="selectedImageIds"
          @add-image="emit('add-existing-image', $event)"
          @browse="handleShowExistingPicker()"
        />
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-orange-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            data-testid="album-browse-favorites"
            @click="handleShowExistingPicker('favorites')"
          >
            Favorites
          </button>
          <button
            type="button"
            class="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-orange-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            data-testid="album-browse-collections"
            @click="handleShowExistingPicker('collections')"
          >
            Collections
          </button>
        </div>
      </div>
    </template>

    <input
      id="album-file-input"
      ref="fileInputRef"
      type="file"
      multiple
      accept="image/*"
      class="hidden"
      :disabled="!fileUploadAvailable"
      @change="handleFileInputChange"
    >
  </div>
  <div
    v-else
    class="bg-gray-50 my-3 rounded-md border-2 border-dotted border-gray-300 p-4 text-center opacity-70 dark:bg-gray-800"
  >
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Maximum limit of {{ maxImages }} images reached
    </p>
  </div>
</template>
