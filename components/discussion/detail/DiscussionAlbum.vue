<script lang="ts" setup>
import type { PropType } from 'vue';
import { ref, computed, onMounted } from 'vue';
import LeftArrowIcon from '@/components/icons/LeftArrowIcon.vue';
import RightArrowIcon from '@/components/icons/RightArrowIcon.vue';
import type { Album } from '@/__generated__/graphql';
import PencilIcon from '@/components/icons/PencilIcon.vue';
import TextEditor from '@/components/TextEditor.vue';
import SaveButton from '@/components/SaveButton.vue';
import CancelButton from '@/components/CancelButton.vue';
import { useMutation } from '@vue/apollo-composable';
import { UPDATE_IMAGE } from '@/graphQLData/discussion/mutations';
import { usernameVar } from '@/cache';
import ModelViewer from '@/components/ModelViewer.vue';
import StlViewer from '@/components/download/StlViewer.vue';
import CarouselThumbnail from '@/components/discussion/detail/CarouselThumbnail.vue';
import ImageLightbox from '@/components/discussion/detail/ImageLightbox.vue';
import { hasGlbExtension, hasStlExtension } from '@/utils/fileTypeUtils';

const props = defineProps({
  album: {
    type: Object as PropType<Album | null>,
    required: false,
    default: null,
  },
  carouselFormat: {
    type: Boolean,
    default: false,
  },
  discussionId: {
    type: String,
    required: true,
  },
  discussionAuthor: {
    type: String,
    required: true,
  },
  showEditAlbum: {
    type: Boolean,
    default: true,
  },
  expandedView: {
    type: Boolean,
    default: false,
  },
  downloadMode: {
    type: Boolean,
    default: false,
  },
  startInLightbox: {
    type: Boolean,
    default: false,
  },
  stlFiles: {
    type: Array as PropType<
      Array<{ id?: string; url: string; fileName?: string }>
    >,
    default: () => [],
  },
  showThumbnails: {
    type: Boolean,
    default: true,
  },
});

// Carousel navigation state
const activeIndex = ref(0);

// Custom lightbox state
const isLightboxOpen = ref(false);
const lightboxIndex = ref(0);

// Compute the main image height based on props - used for both main image and thumbnail column
const mainImageHeight = computed(() => {
  if (!props.expandedView) return 256;
  return props.downloadMode ? 500 : 400;
});

const expandedThumbnailDimensions = computed(() => {
  if (props.expandedView && !props.downloadMode) {
    return { width: 180, height: 120 };
  }
  return { width: 120, height: 120 };
});

const orderedImages = computed(() => {
  let albumImages: any[] = [];

  if (props.album) {
    if (!props.album.imageOrder || props.album.imageOrder.length === 0) {
      albumImages = props.album.Images || [];
    } else {
      albumImages = props.album.imageOrder
        .map((imageId) => {
          const foundImage = props.album?.Images?.find(
            (image) => image.id === imageId
          );
          return foundImage;
        })
        .filter((image) => image !== undefined);
    }
  }

  // Create synthetic "image" objects for STL files
  const stlAsImages = props.stlFiles.map((stlFile, index) => ({
    id: `stl-${stlFile.id || index}`,
    url: stlFile.url,
    alt: stlFile.fileName || `3D Model ${index + 1}`,
    caption: stlFile.fileName || `3D Model: ${stlFile.fileName}`,
    isStlFile: true,
    fileName: stlFile.fileName,
  }));

  // Combine album images with STL files
  const allImages = [...albumImages, ...stlAsImages];
  return allImages;
});

const activeImage = computed(() => {
  return orderedImages.value[activeIndex.value] || null;
});

// Caption editing for thumbnail grid
const editingCaptionIndex = ref(-1);
const editingCaption = ref('');
const isLoggedInAuthor = computed(() => {
  return usernameVar.value === props.discussionAuthor;
});

// Mutation to update image caption
const { mutate: updateImage, loading: updateLoading } =
  useMutation(UPDATE_IMAGE);

// Events emitted by this component
const emit = defineEmits(['album-updated', 'edit-album', 'close-lightbox']);

const startEditingCaption = (index: number) => {
  editingCaptionIndex.value = index;
  editingCaption.value = orderedImages.value[index]?.caption || '';
};

const cancelEditingCaption = () => {
  editingCaptionIndex.value = -1;
  editingCaption.value = '';
};

const saveCaption = async () => {
  if (editingCaptionIndex.value < 0) return;

  const image = orderedImages.value[editingCaptionIndex.value];
  if (!image) return;

  try {
    const result = await updateImage({
      imageId: image.id,
      caption: editingCaption.value,
    });

    emit('album-updated');
    cancelEditingCaption();
  } catch (error) {
    console.error('Error updating caption:', error);
    alert('Error saving caption. Please try again.');
  }
};

// Carousel navigation functions
const goLeft = () => {
  if (activeIndex.value === 0) {
    activeIndex.value = orderedImages.value.length - 1;
  } else {
    activeIndex.value--;
  }
};

const goRight = () => {
  if (activeIndex.value === orderedImages.value.length - 1) {
    activeIndex.value = 0;
  } else {
    activeIndex.value++;
  }
};

// Lightbox functions
const openLightbox = (index: number) => {
  lightboxIndex.value = index;
  isLightboxOpen.value = true;
};

const closeLightbox = () => {
  isLightboxOpen.value = false;
  emit('close-lightbox');
};

// Touch swipe handling for carousel
const touchStartX = ref(0);
const touchEndX = ref(0);

const handleTouchStart = (event: TouchEvent) => {
  const touch = event.touches[0];
  if (!touch) return;
  touchStartX.value = touch.clientX;

  if (editingCaptionIndex.value !== -1) {
    const target = event.target as HTMLElement;
    if (
      target &&
      (target.tagName === 'TEXTAREA' ||
        target.closest('.text-editor-container') ||
        target.closest('form') ||
        target.closest('button'))
    ) {
      return;
    }
  }
};

const handleTouchEnd = (event: TouchEvent) => {
  if (editingCaptionIndex.value !== -1) {
    const target = event.target as HTMLElement;
    if (
      target &&
      (target.tagName === 'TEXTAREA' ||
        target.closest('.text-editor-container') ||
        target.closest('form') ||
        target.closest('button'))
    ) {
      return;
    }
  }

  const touch = event.changedTouches[0];
  if (!touch) return;
  touchEndX.value = touch.clientX;
  const swipeDistance = touchEndX.value - touchStartX.value;

  if (Math.abs(swipeDistance) > 50) {
    if (swipeDistance > 0) {
      goLeft();
    } else {
      goRight();
    }
  }
};

onMounted(() => {
  // Start in lightbox mode if prop is set
  if (props.startInLightbox && orderedImages.value.length > 0) {
    openLightbox(0);
  }
});
</script>

<template>
  <div
    class="relative w-full"
    :class="{
      'z-40': expandedView,
    }"
  >
    <!-- Normal thumbnail grid view -->
    <div
      v-if="!isLightboxOpen && !startInLightbox"
      class="overflow-hidden rounded-lg bg-black"
    >
      <!-- Grid view -->
      <div
        v-if="!carouselFormat"
        class="grid grid-cols-3 gap-2 p-2 dark:text-white"
      >
        <div
          v-for="(image, idx) in orderedImages"
          :key="image?.id || idx"
          class="cursor-pointer"
          @click="openLightbox(idx)"
        >
          <ModelViewer
            v-if="image && hasGlbExtension(image.url ?? '')"
            :model-url="image.url || ''"
            height="200px"
            width="100%"
            class="shadow-sm"
          />
          <ClientOnly
            v-else-if="image && image.url && hasStlExtension(image.url)"
          >
            <StlViewer
              :src="image.url"
              :width="200"
              :height="200"
              class="shadow-sm"
            />
          </ClientOnly>
          <img
            v-else-if="image"
            :src="image.url || ''"
            :alt="image.alt || ''"
            class="shadow-sm"
          />
          <div
            v-if="editingCaptionIndex === idx"
            class="mt-1 text-center text-xs"
            @click.stop
            @mousedown.stop
            @touchstart.stop
          >
            <TextEditor
              :initial-value="editingCaption"
              :allow-image-upload="false"
              placeholder="Write a caption..."
              :rows="2"
              @update="(text) => (editingCaption = text)"
              @click.stop
              @mousedown.stop
              @touchstart.stop
            />
            <div class="mt-1 flex justify-center gap-2">
              <SaveButton
                size="xs"
                :disabled="updateLoading"
                :loading="updateLoading"
                @click.stop="saveCaption"
              />
              <CancelButton size="xs" @click.stop="cancelEditingCaption" />
            </div>
          </div>
          <div v-else class="group relative text-center text-xs">
            <span v-if="image?.caption">
              <span>{{ image.caption }}</span>
              <span
                v-if="isLoggedInAuthor"
                class="bg-transparent ml-2 inline-flex cursor-pointer rounded-full border-0 p-1 text-white transition-colors hover:bg-gray-800"
                role="button"
                tabindex="0"
                @click.stop="startEditingCaption(idx)"
                @keydown.enter.stop="startEditingCaption(idx)"
                @keydown.space.stop="startEditingCaption(idx)"
              >
                <PencilIcon class="re h-3 w-3" />
              </span>
            </span>
            <span v-else-if="!isLoggedInAuthor" class="italic text-gray-400"
              >No caption</span
            >
            <span
              v-else
              class="flex w-full cursor-pointer items-center justify-center gap-1 text-orange-400 hover:text-orange-300"
              role="button"
              tabindex="0"
              @click.stop="startEditingCaption(idx)"
              @keydown.enter.stop="startEditingCaption(idx)"
              @keydown.space.stop="startEditingCaption(idx)"
            >
              <PencilIcon class="h-3 w-3" />
              <span>Add caption</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Carousel view -->
      <div
        v-else
        class="w-full min-w-0 overflow-hidden rounded-lg bg-black"
        :class="{
          'flex flex-col': true,
          'lg:flex-row': expandedView && orderedImages.length > 1,
        }"
      >
        <!-- Thumbnails on the left for large screens in expanded view -->
        <div
          v-if="expandedView && orderedImages.length > 1"
          class="order-2 lg:order-1 lg:flex-shrink-0"
        >
          <div
            class="flex w-full max-w-full gap-2 overflow-x-auto p-2 lg:flex-col lg:overflow-y-auto lg:overflow-x-visible"
            :style="{ maxHeight: `${mainImageHeight}px` }"
            tabindex="0"
            role="region"
            aria-label="Album thumbnails"
          >
            <CarouselThumbnail
              v-for="(image, idx) in orderedImages"
              :key="`thumb-${image?.id || idx}`"
              :image="image"
              :is-active="idx === activeIndex"
              :size="120"
              :width="expandedThumbnailDimensions.width"
              :height="expandedThumbnailDimensions.height"
              @click="activeIndex = idx"
            />
          </div>
        </div>

        <!-- Main content area -->
        <div class="order-1 flex min-w-0 flex-col lg:order-2 lg:flex-1">
          <!-- Image container -->
          <div class="flex items-center justify-center">
            <div
              class="relative touch-pan-x overflow-hidden rounded-lg dark:text-white"
              :class="{
                'w-full min-w-0 max-w-full': expandedView,
                'max-w-96': !expandedView,
              }"
              :style="{
                height: expandedView ? `${mainImageHeight}px` : 'auto',
              }"
              @touchstart="handleTouchStart"
              @touchend="handleTouchEnd"
            >
              <div class="pointer-events-none absolute left-2 top-2 z-10">
                <span class="rounded bg-black/60 px-2 py-1 text-xs text-white">
                  {{ `${activeIndex + 1} of ${orderedImages.length}` }}
                </span>
              </div>
              <div
                v-if="orderedImages.length > 1"
                class="absolute left-2 top-1/2 z-10 -translate-y-1/2"
              >
                <button
                  type="button"
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                  aria-label="Previous image"
                  @click.stop="goLeft"
                >
                  <LeftArrowIcon class="h-4 w-4" />
                </button>
              </div>
              <div
                v-if="orderedImages.length > 1"
                class="absolute right-2 top-1/2 z-10 -translate-y-1/2"
              >
                <button
                  type="button"
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                  aria-label="Next image"
                  @click.stop="goRight"
                >
                  <RightArrowIcon class="h-4 w-4" />
                </button>
              </div>
              <div
                v-if="activeImage"
                class="h-full w-full cursor-pointer"
                @click="openLightbox(activeIndex)"
              >
                <ModelViewer
                  v-if="
                    activeImage &&
                    activeImage.url &&
                    hasGlbExtension(activeImage.url)
                  "
                  :model-url="activeImage.url"
                  :height="expandedView ? '400px' : '256px'"
                  class="object-contain shadow-sm"
                  :style="{
                    aspectRatio: '3/2',
                    width: '100%',
                    maxWidth: expandedView ? '600px' : '384px',
                    maxHeight: expandedView ? '400px' : '256px',
                  }"
                  :show-fullscreen-button="false"
                />
                <ClientOnly
                  v-else-if="
                    activeImage &&
                    activeImage.url &&
                    hasStlExtension(activeImage.url)
                  "
                >
                  <StlViewer
                    :src="activeImage.url"
                    width="100%"
                    :height="expandedView ? 400 : 256"
                    :max-width="expandedView ? '600px' : '384px'"
                    class="object-contain shadow-sm"
                    :style="{
                      aspectRatio: '3/2',
                      width: '100%',
                      maxWidth: expandedView ? '600px' : '384px',
                      maxHeight: expandedView ? '400px' : '256px',
                    }"
                  />
                </ClientOnly>
                <img
                  v-else
                  :src="activeImage.url || ''"
                  :alt="activeImage.alt || ''"
                  class="shadow-sm"
                  :class="{
                    'max-h-96 max-w-96 object-contain': !expandedView,
                    'h-full w-full object-cover': expandedView,
                  }"
                  :style="{
                    maxWidth: expandedView ? '100%' : '384px',
                    maxHeight: expandedView ? 'none' : `${mainImageHeight}px`,
                    height: expandedView ? '100%' : 'auto',
                  }"
                />
              </div>
            </div>
          </div>
          <!-- Thumbnails row for non-expanded view or small screens -->
          <div
            v-if="showThumbnails && !expandedView && orderedImages.length > 1"
            class="mt-2 w-full min-w-0 overflow-x-auto"
          >
            <div class="flex w-full max-w-full gap-2 p-2">
              <CarouselThumbnail
                v-for="(image, idx) in orderedImages"
                :key="`thumb-${image?.id || idx}`"
                :image="image"
                :is-active="idx === activeIndex"
                :size="80"
                @click="activeIndex = idx"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Caption below image and thumbnails -->
      <div v-if="activeImage" class="mt-2 px-2 text-center text-xs">
        <div v-if="editingCaptionIndex === activeIndex">
          <TextEditor
            :initial-value="editingCaption"
            placeholder="Write a caption..."
            :rows="2"
            @update="(text) => (editingCaption = text)"
          />
          <div class="mt-1 flex justify-center gap-2">
            <SaveButton
              size="xs"
              :disabled="updateLoading"
              :loading="updateLoading"
              @click="saveCaption"
            />
            <CancelButton size="xs" @click="cancelEditingCaption" />
          </div>
        </div>
        <div v-else-if="activeImage?.caption" class="group relative">
          <span>
            {{ activeImage.caption }}
          </span>
        </div>
        <div v-else class="h-3"></div>
      </div>
    </div>

    <!-- Lightbox -->
    <ClientOnly>
      <Teleport to="body">
        <ImageLightbox
          v-if="isLightboxOpen"
          :ordered-images="orderedImages"
          :initial-index="lightboxIndex"
          :is-logged-in-author="isLoggedInAuthor"
          @close="closeLightbox"
          @album-updated="emit('album-updated')"
        />
      </Teleport>
    </ClientOnly>
  </div>
</template>
