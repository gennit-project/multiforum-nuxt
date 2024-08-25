<script lang="ts">
import { defineComponent } from "vue";
import { setGallery } from "vue-preview-imgs";
import { ref } from "vue";

type GalleryItem = {
  href: string;
  src: string;
  thumbnail: string;
  width: number;
  height: number;
};

function calculateAspectRatioFit(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number,
) {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return { width: srcWidth * ratio, height: srcHeight * ratio };
}

export default defineComponent({
  props: {
    alt: {
      type: String,
      required: true,
    },
    src: {
      type: String,
      required: true,
    },
    rounded: {
      type: Boolean,
      default: false,
    },
    isSquare: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const embeddedImages = ref<GalleryItem[]>([]);

    // Define a function to update the dimensions
    const updateImageDimensions = (src: string) => {
      const img = new Image();
      img.onload = function () {
        const { width, height } = calculateAspectRatioFit(
          this.width,
          this.height,
          window.innerWidth,
          window.innerHeight,
        );

        // Find the image in the embeddedImages array and update its dimensions
        const imageItem = embeddedImages.value.find((item) => item.src === src);
        if (imageItem) {
          imageItem.width = width;
          imageItem.height = height;
        } else {
          // Or add a new item if it doesn't exist
          embeddedImages.value.push({
            href: src,
            src,
            thumbnail: src,
            width,
            height,
          });
        }
      };
      img.src = src;
    };

    const imageUrl = props.src;
    updateImageDimensions(imageUrl);

    return {
      embeddedImages,
    };
  },
  methods: {
    handleImageClick() {
      // Open Gallery with clickedIndex highlighted
      const lightbox = setGallery({
        dataSource: this.embeddedImages,
        wheelToZoom: true,
      });

      lightbox.loadAndOpen(0);
    },
  },
});
</script>

<template>
  <img
    :src="src"
    :alt="alt"
    class="cursor-pointer"
    :class="{ 'rounded-full': rounded }"
    @click="handleImageClick()"
  >
</template>
