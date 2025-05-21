<script lang="ts" setup>
  import type { PropType } from "vue";
  import { ref, computed, onMounted, onUnmounted } from "vue";
  import LeftArrowIcon from "@/components/icons/LeftArrowIcon.vue";
  import RightArrowIcon from "@/components/icons/RightArrowIcon.vue";
  import type { Album } from "@/__generated__/graphql";
  import { useDisplay } from "vuetify";
  import DownloadIcon from "@/components/icons/DownloadIcon.vue";
  import XmarkIcon from "@/components/icons/XmarkIcon.vue";
  import PencilIcon from "@/components/icons/PencilIcon.vue";
  import TextEditor from "@/components/TextEditor.vue";
  import SaveButton from "@/components/SaveButton.vue";
  import CancelButton from "@/components/CancelButton.vue";
  import { useMutation } from "@vue/apollo-composable";
  import { UPDATE_IMAGE } from "@/graphQLData/discussion/mutations";
  import { usernameVar } from "@/cache";

  const props = defineProps({
    album: {
      type: Object as PropType<Album>,
      required: true,
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
      default: true, // Default to true for backward compatibility
    },
  });

  // Use Vuetify's display utilities for responsive design
  const { mdAndDown } = useDisplay();

  // Carousel navigation state
  const activeIndex = ref(0);

  // Custom lightbox state
  const isLightboxOpen = ref(false);
  const lightboxIndex = ref(0);

  const orderedImages = computed(() => {
    if (!props.album) {
      return [];
    }
    if (!props.album.imageOrder) {
      return props.album.Images || [];
    }
    return props.album.imageOrder.map((imageId) => {
      return props.album.Images.find((image) => image.id === imageId);
    });
  });

  // Current image based on ordered images
  const currentImage = computed(() => {
    return orderedImages.value[lightboxIndex.value] || {};
  });
  const isPanelVisible = ref(true);

  // Caption editing
  const editingCaptionIndex = ref(-1);
  const editingCaption = ref("");
  const isLoggedInAuthor = computed(() => {
    return usernameVar.value === props.discussionAuthor;
  });

  // Mutation to update image caption
  const { mutate: updateImage, loading: updateLoading } = useMutation(UPDATE_IMAGE);

  // Events emitted by this component
  const emit = defineEmits(["album-updated", "edit-album"]);

  const startEditingCaption = (index: number) => {
    // Set which image we're editing and initialize with current caption
    editingCaptionIndex.value = index;
    editingCaption.value = orderedImages.value[index]?.caption || "";
  };

  const cancelEditingCaption = () => {
    editingCaptionIndex.value = -1;
    editingCaption.value = "";
  };

  const saveCaption = async () => {
    if (editingCaptionIndex.value < 0) return;

    // Get the image being edited
    const image = orderedImages.value[editingCaptionIndex.value];
    if (!image) return;

    try {
      // Use the simplified mutation to just update the image's caption
      const result = await updateImage({
        imageId: image.id,
        caption: editingCaption.value,
      });

      // Emit event to parent component that album was updated
      emit("album-updated");

      // Reset editing state
      cancelEditingCaption();

      console.log("Caption saved successfully:", result);
    } catch (error) {
      console.error("Error updating caption:", error);
      alert("Error saving caption. Please try again.");
    }
  };

  // Zoom functionality
  const zoomLevel = ref(1);
  const isZoomed = computed(() => zoomLevel.value > 1);

  // Image panning
  const isDragging = ref(false);
  const startX = ref(0);
  const startY = ref(0);
  const translateX = ref(0);
  const translateY = ref(0);

  const startDrag = (event: MouseEvent) => {
    if (!isZoomed.value) return;

    // Only start dragging on left mouse button (button 0)
    if (event.button !== 0) return;

    event.preventDefault();
    isDragging.value = true;
    startX.value = event.clientX - translateX.value;
    startY.value = event.clientY - translateY.value;
  };

  const onDrag = (event: MouseEvent) => {
    // Only move if we're actively dragging (mouse button is held down)
    if (!isDragging.value) return;

    // Don't handle drag events if we're editing a caption
    if (editingCaptionIndex.value !== -1) return;

    // Check if the event target is inside the text editor
    const target = event.target as HTMLElement;
    if (
      target &&
      (target.tagName === "TEXTAREA" ||
        target.closest(".text-editor-container") ||
        target.closest("button"))
    ) {
      return;
    }

    event.preventDefault();
    translateX.value = event.clientX - startX.value;
    translateY.value = event.clientY - startY.value;
  };

  const stopDrag = (event?: MouseEvent) => {
    // Stop dragging when mouse button is released
    isDragging.value = false;

    // If we have an event and are editing a caption, check if the click is inside the editor
    if (event && editingCaptionIndex.value !== -1) {
      const target = event.target as HTMLElement;
      if (
        target &&
        (target.tagName === "TEXTAREA" || target.closest("form") || target.closest("button"))
      ) {
        // Don't do anything if the click is inside the editor
        event.stopPropagation();
      }
    }
  };

  // Handle touch events for mobile devices when zoomed in
  const startTouchDrag = (event: TouchEvent) => {
    // Only handle panning when zoomed in
    if (!isZoomed.value) return;

    // Don't handle if we're editing a caption
    if (editingCaptionIndex.value !== -1) {
      const target = event.target as HTMLElement;
      if (
        target &&
        (target.tagName === "TEXTAREA" ||
          target.closest(".text-editor-container") ||
          target.closest("form") ||
          target.closest("button"))
      ) {
        return;
      }
    }

    // Prevent default to avoid scrolling while panning
    event.preventDefault();
    isDragging.value = true;

    const touch = event.touches[0];
    startX.value = touch.clientX - translateX.value;
    startY.value = touch.clientY - translateY.value;
  };

  const onTouchDrag = (event: TouchEvent) => {
    if (!isDragging.value) return;

    event.preventDefault();

    const touch = event.touches[0];
    translateX.value = touch.clientX - startX.value;
    translateY.value = touch.clientY - startY.value;
  };

  // Reset translation when changing images or zoom
  const resetTranslation = () => {
    translateX.value = 0;
    translateY.value = 0;
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
    isPanelVisible.value = true; // Always show panel when opening lightbox
    zoomLevel.value = 1; // Reset zoom when opening lightbox
    resetTranslation(); // Reset position when opening lightbox
    document.body.style.overflow = "hidden"; // Prevent scrolling
  };

  const closeLightbox = () => {
    isLightboxOpen.value = false;
    zoomLevel.value = 1; // Reset zoom when closing
    resetTranslation(); // Reset position when closing
    document.body.style.overflow = ""; // Restore scrolling
  };

  const nextImage = () => {
    if (lightboxIndex.value === orderedImages.value.length - 1) {
      lightboxIndex.value = 0;
    } else {
      lightboxIndex.value++;
    }
    zoomLevel.value = 1; // Reset zoom when changing images
    resetTranslation(); // Reset position when changing images
  };

  const prevImage = () => {
    if (lightboxIndex.value === 0) {
      lightboxIndex.value = orderedImages.value.length - 1;
    } else {
      lightboxIndex.value--;
    }
    zoomLevel.value = 1; // Reset zoom when changing images
    resetTranslation(); // Reset position when changing images
  };

  // Toggle panel visibility
  const togglePanel = () => {
    isPanelVisible.value = !isPanelVisible.value;
  };

  // Zoom functions
  const zoomIn = () => {
    if (zoomLevel.value < 3) {
      zoomLevel.value += 0.5;
    }
  };

  const zoomOut = () => {
    if (zoomLevel.value > 1) {
      zoomLevel.value -= 0.5;
    }
  };

  const resetZoom = () => {
    zoomLevel.value = 1;
    resetTranslation();
  };

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (isLightboxOpen.value) {
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowRight") {
        nextImage();
      } else if (e.key === "ArrowLeft") {
        prevImage();
      } else if (e.key === "i") {
        // 'i' for info panel toggle
        togglePanel();
      } else if (e.key === "+") {
        zoomIn();
      } else if (e.key === "-") {
        zoomOut();
      } else if (e.key === "0") {
        resetZoom();
      }
    }
  };

  // Custom event handler for mouseup that checks for text editor
  const handleMouseUp = (event: MouseEvent) => {
    // If we're editing a caption and the click is in the editor area, don't close
    if (editingCaptionIndex.value !== -1) {
      const target = event.target as HTMLElement;
      if (
        target &&
        (target.tagName === "TEXTAREA" ||
          target.closest(".text-editor-container") ||
          target.closest("form") ||
          target.closest("button"))
      ) {
        event.stopPropagation();
        return;
      }
    }

    stopDrag(event);
  };

  onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);

    // Global event listeners to handle events outside the image element
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", stopDrag); // Stop dragging if mouse leaves window
    window.addEventListener("mousemove", onDrag);

    // Touch events for mobile
    window.addEventListener("touchend", stopDrag);
    window.addEventListener("touchcancel", stopDrag);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("mouseleave", stopDrag);
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("touchend", stopDrag);
    window.removeEventListener("touchcancel", stopDrag);
    document.body.style.overflow = ""; // Ensure scrolling is restored
  });

  const downloadImage = (imageUrl: string) => {
    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        // Create blob URL
        const blobUrl = URL.createObjectURL(blob);

        // Create download link
        const downloadLink = document.createElement("a");
        downloadLink.href = blobUrl;
        const filename = imageUrl.split("/").pop() || "image.jpg";
        downloadLink.download = filename;

        // Append to document, click, and clean up
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Release the blob URL
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 100);
      })
      .catch((error) => {
        console.error("Download failed:", error);
      });
  };

  const touchStartX = ref(0);
  const touchEndX = ref(0);

  const handleTouchStart = (event: TouchEvent) => {
    // Store the initial touch position
    touchStartX.value = event.touches[0].clientX;

    // If we're in the lightbox view and zoomed in, let the image panning handle this
    if (isLightboxOpen.value && isZoomed.value) {
      return;
    }

    // If we're editing a caption, ignore swipes
    if (editingCaptionIndex.value !== -1) {
      // Check if the touch is inside the editor
      const target = event.target as HTMLElement;
      if (
        target &&
        (target.tagName === "TEXTAREA" ||
          target.closest(".text-editor-container") ||
          target.closest("form") ||
          target.closest("button"))
      ) {
        return;
      }
    }
  };

  const handleTouchEnd = (event: TouchEvent) => {
    // If we're in the lightbox view and zoomed in, let the image panning handle this
    if (isLightboxOpen.value && isZoomed.value) {
      return;
    }

    // If we're editing a caption, ignore swipes
    if (editingCaptionIndex.value !== -1) {
      // Check if the touch is inside the editor
      const target = event.target as HTMLElement;
      if (
        target &&
        (target.tagName === "TEXTAREA" ||
          target.closest(".text-editor-container") ||
          target.closest("form") ||
          target.closest("button"))
      ) {
        return;
      }
    }

    touchEndX.value = event.changedTouches[0].clientX;
    const swipeDistance = touchEndX.value - touchStartX.value;

    // Only trigger if the swipe is significant enough (e.g., > 50px)
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance > 0) {
        // Swiped right - go to previous image
        if (isLightboxOpen.value) {
          prevImage();
        } else {
          goLeft();
        }
      } else {
        // Swiped left - go to next image
        if (isLightboxOpen.value) {
          nextImage();
        } else {
          goRight();
        }
      }
    }
  };
</script>

<template>
  <div class="h-full w-full">
    <!-- Normal thumbnail grid view -->
    <div
      v-if="!isLightboxOpen"
      class="overflow-x-auto border"
    >
      <!-- Grid view -->
      <div
        v-if="!carouselFormat"
        class="grid grid-cols-3 gap-2 dark:text-white"
      >
        <div
          v-for="(image, idx) in orderedImages"
          :key="image?.id || idx"
          class="cursor-pointer"
          @click="openLightbox(idx)"
        >
          <img
            v-if="image"
            :alt="image.alt || ''"
            class="shadow-sm"
            :src="image.url || ''"
          />
          <div
            v-if="editingCaptionIndex === idx"
            class="mt-1 text-center text-xs"
            @click.stop
            @mousedown.stop
            @touchstart.stop
          >
            <TextEditor
              :allow-image-upload="false"
              :initial-value="editingCaption"
              placeholder="Write a caption..."
              :rows="2"
              @click.stop
              @mousedown.stop
              @touchstart.stop
              @update="(text) => (editingCaption = text)"
            />
            <div class="mt-1 flex justify-center gap-2">
              <SaveButton
                :disabled="updateLoading"
                :loading="updateLoading"
                size="xs"
                @click.stop="saveCaption"
              />
              <CancelButton
                size="xs"
                @click.stop="cancelEditingCaption"
              />
            </div>
          </div>
          <div
            v-else
            class="group relative text-center text-xs"
          >
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
            <span
              v-else-if="!isLoggedInAuthor"
              class="italic text-gray-400"
              >No caption</span
            >
            <span
              v-else
              class="flex w-full cursor-pointer items-center justify-center gap-1 text-blue-400 hover:text-blue-300"
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
        class="flex flex-col"
      >
        <!-- Counter and navigation row -->
        <div class="flex items-center justify-between p-2">
          <span class="text-sm">{{ `${activeIndex + 1} of ${orderedImages.length}` }}</span>

          <div class="flex items-center gap-2">
            <!-- Navigation Buttons -->
            <div
              v-if="orderedImages.length > 1"
              class="flex gap-2"
            >
              <button
                class="flex h-8 items-center justify-center px-2 hover:bg-gray-500"
                type="button"
                @click="goLeft"
              >
                <LeftArrowIcon class="h-4 w-4" />
              </button>

              <button
                class="flex h-8 items-center justify-center px-2 hover:bg-gray-500"
                type="button"
                @click="goRight"
              >
                <RightArrowIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Image container -->
        <div class="flex items-center justify-center">
          <div
            class="mb-4 flex max-h-96 max-w-96 rounded dark:text-white"
            @touchend="handleTouchEnd"
            @touchstart="handleTouchStart"
          >
            <div
              v-for="(image, idx) in orderedImages"
              :key="image?.id || idx"
              class="flex w-auto flex-shrink-0"
            >
              <div
                class="max-h-96 min-h-10 max-w-96 cursor-pointer"
                @click="openLightbox(idx)"
              >
                <img
                  v-if="image"
                  :alt="image.alt || ''"
                  class="max-h-96 max-w-96 shadow-sm"
                  :class="{ hidden: idx !== activeIndex }"
                  :src="image.url || ''"
                />
                <div
                  v-if="editingCaptionIndex === idx && idx === activeIndex"
                  class="mt-1 text-center text-xs"
                >
                  <TextEditor
                    :initial-value="editingCaption"
                    placeholder="Write a caption..."
                    :rows="2"
                    @update="(text) => (editingCaption = text)"
                  />
                  <div class="mt-1 flex justify-center gap-2">
                    <SaveButton
                      :disabled="updateLoading"
                      :loading="updateLoading"
                      size="xs"
                      @click="saveCaption"
                    />
                    <CancelButton
                      size="xs"
                      @click="cancelEditingCaption"
                    />
                  </div>
                </div>
                <div
                  v-else
                  class="group relative text-center text-xs"
                  :class="{ hidden: idx !== activeIndex }"
                >
                  <span v-if="image?.caption">
                    {{ image.caption }}
                  </span>
                  <span
                    v-else-if="!isLoggedInAuthor"
                    class="italic text-gray-400"
                    >No caption</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom lightbox with split layout -->
    <div
      v-if="isLightboxOpen"
      class="fixed left-0 top-0 z-50 h-full w-full bg-black transition-all duration-300 ease-in-out"
      :class="{
        'flex-col': mdAndDown,
        flex: true,
      }"
    >
      <!-- Left panel for images (75% width on desktop, full width on mobile) -->
      <div
        class="relative z-40 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
        :class="{
          'h-full w-3/4': !mdAndDown && isPanelVisible,
          'h-full w-full': mdAndDown || !isPanelVisible,
        }"
      >
        <div class="z-50 flex items-center justify-between p-2 px-5 text-white">
          <div class="flex items-center gap-4">
            <button
              class="bg-transparent cursor-pointer border-0 text-3xl text-white"
              @click="closeLightbox"
            >
              ×
            </button>
            <div class="flex-1">
              <span class="text-sm">{{ `${lightboxIndex + 1} of ${orderedImages.length}` }}</span>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <!-- Zoom controls -->
            <div class="flex items-center rounded bg-opacity-10">
              <button
                class="cursor-pointer px-2 py-1 text-white transition-colors hover:bg-opacity-20"
                :class="{ 'cursor-not-allowed opacity-50': zoomLevel <= 1 }"
                :disabled="zoomLevel <= 1"
                title="Zoom out"
                @click="zoomOut"
              >
                −
              </button>
              <span class="px-2 text-sm text-white">{{ Math.round(zoomLevel * 100) }}%</span>
              <button
                class="cursor-pointer px-2 py-1 text-white transition-colors hover:bg-opacity-20"
                :class="{ 'cursor-not-allowed opacity-50': zoomLevel >= 3 }"
                :disabled="zoomLevel >= 3"
                title="Zoom in"
                @click="zoomIn"
              >
                +
              </button>
              <button
                v-if="isZoomed"
                class="cursor-pointer px-2 py-1 text-white transition-colors hover:bg-opacity-20"
                title="Reset zoom"
                @click="resetZoom"
              >
                Reset
              </button>
            </div>

            <!-- Panel toggle button -->
            <button
              class="cursor-pointer rounded border-0 bg-gray-800 bg-opacity-10 px-2 py-1 text-sm text-white transition-colors"
              :title="isPanelVisible ? 'Hide panel' : 'Show panel'"
              @click="togglePanel"
            >
              <span v-if="isPanelVisible">Close panel</span>
              <span v-else>Open panel</span>
            </button>
            <button
              class="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-xl text-white no-underline hover:bg-white hover:bg-opacity-20"
              :href="currentImage.url || ''"
              type="button"
              @click="() => downloadImage(currentImage.url || '')"
            >
              <DownloadIcon class="h-6 w-6" />
            </button>
          </div>
        </div>

        <div
          class="relative flex h-full flex-1 items-center justify-center overflow-hidden"
          @click="
            (event) => {
              // Don't close editing mode if click happens within editor
              if (editingCaptionIndex !== -1) {
                const target = event.target as HTMLElement;
                if (
                  target &&
                  (target.tagName === 'TEXTAREA' ||
                    target.closest('.text-editor-container') ||
                    target.closest('form') ||
                    target.closest('button'))
                ) {
                  event.stopPropagation();
                }
              }
            }
          "
          @touchend="handleTouchEnd"
          @touchstart="handleTouchStart"
        >
          <button
            v-if="orderedImages.length > 1"
            class="absolute left-5 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-0 bg-black bg-opacity-50 text-white"
            @click="prevImage"
          >
            <LeftArrowIcon class="h-6 w-6" />
          </button>

          <img
            :alt="currentImage.alt || ''"
            class="object-contain transition-all duration-300 ease-in-out"
            :class="{
              'max-h-[90%] max-w-[90%]': isPanelVisible && !isZoomed,
              'max-h-[95%] max-w-[95%]': !isPanelVisible && !isZoomed,
            }"
            :src="currentImage.url || ''"
            :style="{
              transform: `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`,
              cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'auto',
            }"
            @mousedown="startDrag"
            @touchend="isZoomed ? undefined : handleTouchEnd"
            @touchmove="isZoomed ? onTouchDrag : undefined"
            @touchstart="isZoomed ? startTouchDrag : handleTouchStart"
          />

          <button
            v-if="orderedImages.length > 1"
            class="absolute right-5 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-0 bg-black bg-opacity-50 text-white"
            @click="nextImage"
          >
            <RightArrowIcon class="h-6 w-6" />
          </button>
        </div>
      </div>

      <!-- Right/Bottom panel for custom content (different layouts based on screen size) -->
      <div
        v-if="isPanelVisible"
        class="z-40 overflow-y-auto bg-gray-900 text-white transition-all duration-300 ease-in-out"
        :class="{
          'h-full w-1/4': !mdAndDown,
          'h-22 absolute bottom-0 left-0 min-h-[70px] w-full shadow-md shadow-black': mdAndDown,
        }"
      >
        <div class="relative p-5">
          <button
            class="bg-transparent absolute right-2 top-2 rounded-full border-0 p-1 text-white transition-colors hover:bg-gray-800"
            title="Close panel"
            @click="togglePanel"
          >
            <XmarkIcon class="h-4 w-4" />
          </button>
          <div
            v-if="editingCaptionIndex === lightboxIndex"
            class="mb-4 pb-2 pr-6"
            @click.stop
            @mousedown.stop
            @mousemove.stop
            @mouseup.stop
            @touchstart.stop
          >
            <TextEditor
              class="text-editor-container"
              :initial-value="editingCaption"
              placeholder="Write a caption for this image..."
              :rows="3"
              @click.stop
              @input.stop
              @keydown.stop
              @keyup.stop
              @mousedown.stop
              @mousemove.stop
              @mouseup.stop
              @touchstart.stop
              @update="(text) => (editingCaption = text)"
            />
            <div class="mt-2 flex gap-2">
              <SaveButton
                :disabled="updateLoading"
                :loading="updateLoading"
                @click.stop="saveCaption"
              />
              <CancelButton @click.stop="cancelEditingCaption" />
            </div>
          </div>
          <div
            v-else-if="currentImage?.caption"
            class="text-md relative mb-4 flex border-white border-opacity-20 pb-2 pr-6"
          >
            <span> {{ currentImage.caption || "Image Details" }}</span>
            <span
              v-if="isLoggedInAuthor"
              class="bg-transparent cursor-pointer rounded-full border-0 px-2 text-white transition-colors hover:bg-gray-800"
              role="button"
              tabindex="0"
              title="Edit caption"
              @click="startEditingCaption(lightboxIndex)"
              @keydown.enter="startEditingCaption(lightboxIndex)"
              @keydown.space="startEditingCaption(lightboxIndex)"
            >
              <PencilIcon class="h-4 w-4" />
            </span>
          </div>
          <div
            v-else
            class="relative mt-2 italic text-gray-400"
          >
            <span v-if="!isLoggedInAuthor">No caption available for this image.</span>
            <span
              v-else
              class="flex cursor-pointer items-center gap-1 text-blue-400 transition-colors hover:text-blue-300"
              role="button"
              tabindex="0"
              @click="startEditingCaption(lightboxIndex)"
              @keydown.enter="startEditingCaption(lightboxIndex)"
              @keydown.space="startEditingCaption(lightboxIndex)"
            >
              <PencilIcon class="h-4 w-4" />
              <span>Add a caption for this image</span>
            </span>
          </div>
          <!-- <MarkdownPreview
            v-if="currentImage.caption"
            :text="currentImage.caption"
          /> -->
        </div>
      </div>
    </div>
  </div>
</template>
