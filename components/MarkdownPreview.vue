<script lang="ts">
import { computed, defineComponent, ref, watchEffect } from "vue";
import VueEasyLightbox from "vue-easy-lightbox";
import MarkdownIt from "markdown-it";
import config from "@/config";
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'

function linkifyUsernames(markdownString: string) {
  const regex = /(?<!https?:\/\/(?:[\w.-]+))\b(u\/|@)([a-zA-Z0-9_-]+)/g;
  return markdownString.replace(regex, (match, prefix, username) => {
    return `[${prefix}${username}](${config.baseUrl}u/${username})`;
  });
}

function linkifyChannelNames(markdownString: string) {
  const regex = /(?<!https?:\/\/(?:[\w.-]+))\bc\/([a-zA-Z0-9_-]+)/g;
  return markdownString.replace(regex, (match, channelName) => {
    return `[${match}](${config.baseUrl}channels/f/${channelName}/discussions)`;
  });
}

function linkifyUrls(text: string) {
  const urlRegex = /(?:https?:\/\/|www\.)[^\s/$.?#].[^\s)]+[^\s)]+/g;
  const markdownLinkRegex =
    /\[([^\]]+)\]\((https?:\/\/|www\.)[^\s/$.?#].[^\s)]*\)/g;
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const markdownLinks: string[] = [];
  let match;
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    markdownLinks.push(match[0]);
  }
  return text.replace(urlRegex, (url) => {
    let href = url;
    if (!url.startsWith("http")) {
      href = "http://" + url;
    }
    if (
      markdownLinks.some((link) => link.includes(url)) ||
      emailRegex.test(url)
    ) {
      return url;
    }
    return `[${url}](${href})`;
  });
}

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

function parseMarkdownForImages(text: string) {
  const md = new MarkdownIt();
  const renderedText = md.render(text);
  const regex = /src="([^"]*)"/g;
  const images: GalleryItem[] = [];
  let match;
  while ((match = regex.exec(renderedText)) !== null) {
    const src = match[1];
    const galleryItem: GalleryItem = {
      href: src,
      src,
      thumbnail: src,
      width: import.meta.client ? window.innerWidth : 0,
      height: import.meta.client ? window.innerHeight : 0,
    };
    images.push(galleryItem);
  }
  return images;
}

export default defineComponent({
  components: {
    MarkdownRenderer,
    VueEasyLightbox,
  },
  props: {
    disableGallery: {
      type: Boolean,
      default: false,
    },
    showShowMore: {
      type: Boolean,
      default: true,
    },
    text: {
      type: String,
      required: true,
    },
    wordLimit: {
      type: Number,
      default: 100,
    },
  },
  setup(props) {
    const embeddedImages = ref<GalleryItem[]>([]);
    const visibleRef = ref(false);
    const indexRef = ref(0);

    const countWords = (str: string) => {
      return str.trim().split(/\s+/).length;
    };

    const showFullText = ref(
      !props.showShowMore || countWords(props.text) < props.wordLimit,
    );

    const shouldShowMoreButton = computed(() => {
      if (!props.showShowMore) {
        return false;
      }
      if (!props.text) {
        return false;
      }
      const words = props.text.split(" ");
      return words.length > props.wordLimit;
    });

    const toggleShowFullText = () => {
      showFullText.value = !showFullText.value;
    };

    const updateImageDimensions = (src: string) => {
      if (import.meta.client) {
        const img = new Image();
        img.onload = function () {
          const { width, height } = calculateAspectRatioFit(
            this.width,
            this.height,
            window.innerWidth,
            window.innerHeight,
          );

          const imageItem = embeddedImages.value.find((item) => item.src === src);
          if (imageItem) {
            imageItem.width = width;
            imageItem.height = height;
          } else {
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
      }
    };

    watchEffect(() => {
      const imageUrls = parseMarkdownForImages(props.text);
      imageUrls.forEach((imageUrl: GalleryItem) => {
        updateImageDimensions(imageUrl.src);
      });
    });

    const linkifiedMarkdown = computed(() => {
      const usernamesLinkified = linkifyUsernames(props.text);
      const channelNamesLinkified = linkifyChannelNames(usernamesLinkified);
      return linkifyUrls(channelNamesLinkified);
    });

    const shownText = computed(() => {
      if (showFullText.value) {
        return linkifiedMarkdown.value;
      }
      const words = linkifiedMarkdown.value.split(" ");
      if (words.length > props.wordLimit) {
        return (
          words.slice(0, props.wordLimit).join(" ") +
          (words.length > props.wordLimit ? "..." : "")
        );
      }
      return linkifiedMarkdown.value;
    });

    const handleImageClick = (event: any) => {
      if (props.disableGallery) {
        return;
      }
      if (event.target.tagName === "IMG") {
        const clickedSrc = event.target.src;
        const clickedIndex = embeddedImages.value.findIndex(
          (image: GalleryItem) => image.href === clickedSrc,
        );
        if (clickedIndex !== -1) {
          indexRef.value = clickedIndex;
          visibleRef.value = true;
        }
      }
    };

    const onHide = () => {
      visibleRef.value = false;
    };

    return {
      embeddedImages,
      shownText,
      showFullText,
      toggleShowFullText,
      shouldShowMoreButton,
      handleImageClick,
      visibleRef,
      indexRef,
      onHide,
    };
  },
});
</script>

<template>
  <div class="w-full dark:text-white">
    <MarkdownRenderer
      :text="`${shownText}${!showFullText ? '...' : ''}`"
      :class="[ { clickable: !disableGallery }]"
      @click="handleImageClick"
    />
    <button
      v-if="shouldShowMoreButton"
      class="ml-4 text-sm font-bold text-blue-600 hover:underline dark:text-gray-300"
      @click="toggleShowFullText"
    >
      {{ showFullText ? "Show Less" : "Show More" }}
    </button>
    <vue-easy-lightbox
      :visible="visibleRef"
      :imgs="embeddedImages.map((image) => image.src)"
      :index="indexRef"
      @hide="onHide"
    />
  </div>
</template>

<style lang="scss">
.markdown-body img {
  max-height: 350px !important;
  // width should be proportionate to height
  max-width: 100% !important;
  height: auto !important;
  cursor: pointer !important;
  // center images
  display: block !important;
  margin-left: auto !important;
  margin-right: auto !important;
}

p,
li {
  font-size: 0.9rem !important;
  font-weight: 400 !important;
  line-height: 1.5 !important;
  margin-bottom: 0.25rem !important;
}

p {
  margin-bottom: 1rem !important;
}

ul, ol {
  list-style-type: disc !important;
  margin-left: 1rem !important;
  margin-bottom: 1rem !important;
}

</style>
