<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, useId } from 'vue';
import TrashIcon from '@/components/icons/TrashIcon.vue';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue';
import TextInput from '@/components/TextInput.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import ExpandableImage from '@/components/ExpandableImage.vue';
import ModelViewer from '@/components/ModelViewer.vue';
import { hasGlbExtension, hasStlExtension } from '@/utils/fileTypeUtils';

// StlViewer statically imports three.js (~2MB decoded). Load it lazily so that
// weight is only fetched when an STL image actually renders.
const StlViewer = defineAsyncComponent(
  () => import('@/components/download/StlViewer.vue')
);

type ImageData = {
  id?: string;
  url: string;
  alt: string;
  caption: string;
  copyright: string;
  Uploader?: {
    username?: string | null;
    displayName?: string | null;
  } | null;
};

const props = defineProps<{
  image: ImageData;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'update-field', field: keyof ImageData, value: string): void;
  (e: 'delete' | 'move-up' | 'move-down'): void;
}>();

// Attribution and the image URL are rarely edited, so they start collapsed.
const showMore = ref(false);
const moreId = useId();

const imageNumber = computed(() => props.index + 1);
// A file name ("07-21-25_5-25-45PM.png") describes nothing, so treat it like
// missing alt text. Older uploads defaulted alt text to the file name.
const FILE_NAME_ALT = /^[^\s/]+\.(png|jpe?g|gif|webp|avif|svg|glb|stl)$/i;
const altHint = computed(() => {
  const alt = props.image.alt?.trim() || '';
  if (!alt) return 'Alt text missing';
  if (FILE_NAME_ALT.test(alt)) return 'Alt text is a file name';
  return '';
});

const getUploaderLabel = (image: ImageData) => {
  const uploader = image.Uploader;
  if (!uploader?.username) return '';
  return uploader.displayName
    ? `${uploader.displayName} (${uploader.username})`
    : uploader.username;
};
</script>

<template>
  <div
    class="flex flex-wrap items-start gap-3 border-b border-gray-200 py-3 last:border-b-0 sm:flex-nowrap dark:border-gray-700"
  >
    <span class="sr-only">Image {{ imageNumber }}</span>

    <!-- Reorder -->
    <div class="flex flex-col gap-1">
      <button
        type="button"
        class="rounded border border-gray-300 p-1 text-gray-700 dark:border-gray-600 dark:text-gray-200"
        :disabled="isFirst"
        :class="{ 'cursor-not-allowed opacity-50': isFirst }"
        :aria-label="`Move image ${imageNumber} up`"
        @click="emit('move-up')"
      >
        <ChevronDownIcon class="h-4 w-4 rotate-180" />
      </button>
      <button
        type="button"
        class="rounded border border-gray-300 p-1 text-gray-700 dark:border-gray-600 dark:text-gray-200"
        :disabled="isLast"
        :class="{ 'cursor-not-allowed opacity-50': isLast }"
        :aria-label="`Move image ${imageNumber} down`"
        @click="emit('move-down')"
      >
        <ChevronDownIcon class="h-4 w-4" />
      </button>
    </div>

    <!-- Thumbnail -->
    <div class="relative w-28 shrink-0 overflow-hidden rounded-md">
      <ModelViewer
        v-if="image.url && hasGlbExtension(image.url)"
        :model-url="image.url"
        :model-alt="image.alt || image.caption || 'Interactive 3D model'"
        height="112px"
        width="112px"
      />
      <ClientOnly v-else-if="image.url && hasStlExtension(image.url)">
        <StlViewer :src="image.url" :width="112" :height="112" />
      </ClientOnly>
      <ExpandableImage
        v-else-if="image.url"
        class="w-28 object-cover"
        :src="image.url"
        :alt="image.alt"
        :full-width="true"
        :width="112"
        :height="112"
        sizes="112px"
      />
      <span
        v-if="isFirst"
        class="absolute left-1 top-1 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-800 dark:text-blue-300"
      >
        Cover
      </span>
    </div>

    <!-- Delete (sits on the top row next to the thumbnail on small screens) -->
    <button
      type="button"
      class="ml-auto rounded border border-gray-300 p-1.5 text-gray-600 hover:text-red-600 sm:order-last sm:ml-0 dark:border-gray-600 dark:text-gray-300 dark:hover:text-red-400"
      :aria-label="`Remove image ${imageNumber} from album`"
      title="Remove image from album"
      @click="emit('delete')"
    >
      <TrashIcon class="h-4 w-4" />
    </button>

    <!-- Fields -->
    <div class="w-full min-w-0 space-y-2 sm:w-auto sm:flex-1">
      <LoadingSpinner v-if="isLoading" />
      <TextInput
        :value="image.caption"
        label="Caption"
        :aria-label="`Caption for image ${imageNumber}`"
        placeholder="Short caption or description"
        :full-width="true"
        @update="(val) => emit('update-field', 'caption', val)"
      />
      <TextInput
        :value="image.alt"
        label="Alt text"
        :aria-label="`Alt text for image ${imageNumber}`"
        placeholder="Describe the image for people using screen readers"
        :full-width="true"
        @update="(val) => emit('update-field', 'alt', val)"
      />
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span
          v-if="altHint"
          class="font-medium text-yellow-600 dark:text-yellow-400"
          data-testid="missing-alt-hint"
        >
          {{ altHint }}
        </span>
        <button
          type="button"
          class="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          :aria-expanded="showMore"
          :aria-controls="moreId"
          @click="showMore = !showMore"
        >
          <ChevronDownIcon
            class="h-3 w-3 transition-transform"
            :class="showMore ? 'rotate-180' : ''"
          />
          {{ showMore ? 'Less' : 'More: attribution, URL' }}
        </button>
        <span
          v-if="getUploaderLabel(image)"
          class="text-gray-500 dark:text-gray-400"
        >
          Uploaded by {{ getUploaderLabel(image) }}
        </span>
      </div>
      <div
        v-if="showMore"
        :id="moreId"
        class="space-y-2 border-l-2 border-gray-200 pl-3 dark:border-gray-700"
      >
        <TextInput
          :value="image.copyright"
          label="Attribution"
          :aria-label="`Attribution for image ${imageNumber}`"
          placeholder="Who took this photo? (optional)"
          :full-width="true"
          @update="(val) => emit('update-field', 'copyright', val)"
        />
        <TextInput
          :value="image.url"
          label="Image URL"
          :aria-label="`Image URL for image ${imageNumber}`"
          placeholder="https://example.com/my-image.jpg"
          :full-width="true"
          @update="(val) => emit('update-field', 'url', val)"
        />
      </div>
    </div>
  </div>
</template>
