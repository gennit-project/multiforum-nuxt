<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import VueEasyLightbox from 'vue-easy-lightbox';
import { config } from '@/config';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';
import {
  linkifyChannelNames,
  linkifyBotMentions,
  linkifyUrls,
  calculateAspectRatioFit,
  extractImageUrlsFromMarkdown,
  countWords,
  type GalleryItem,
} from '@/utils/markdownLinkify';

interface Props {
  disableGallery?: boolean;
  showShowMore?: boolean;
  text: string;
  botMentionForumId?: string;
  wordLimit?: number;
  imageMaxHeight?: string;
  allowImages?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disableGallery: false,
  showShowMore: true,
  botMentionForumId: '',
  wordLimit: 100,
  imageMaxHeight: '350px',
  allowImages: true,
});

const uiStore = useUIStore();
const embeddedImages = ref<GalleryItem[]>([]);
const visibleRef = ref(false);
const indexRef = ref(0);
const { fontSize } = storeToRefs(uiStore);

const showFullText = ref(
  !props.showShowMore || countWords(props.text) < props.wordLimit
);

const shouldShowMoreButton = computed(() => {
  if (!props.showShowMore) {
    return false;
  }
  if (!props.text) {
    return false;
  }
  const words = props.text.split(' ');
  return words.length > props.wordLimit;
});

const toggleShowFullText = () => {
  showFullText.value = !showFullText.value;
};

const updateImageDimensions = (src: string) => {
  if (import.meta.client) {
    const img = new Image();
    img.onload = function () {
      const { width, height } = calculateAspectRatioFit({
        srcWidth: img.width,
        srcHeight: img.height,
        maxWidth: window.innerWidth,
        maxHeight: window.innerHeight,
      });

      const imageItem = embeddedImages.value.find(
        (item) => item.src === src
      );
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
  if (!props.allowImages) {
    embeddedImages.value = [];
    return;
  }
  const imageUrls = extractImageUrlsFromMarkdown(props.text);
  imageUrls.forEach((imageUrl: GalleryItem) => {
    updateImageDimensions(imageUrl.src);
  });
});

const linkifiedMarkdown = computed(() => {
  const botMentionsLinkified = linkifyBotMentions({
    markdownString: props.text,
    forumId: props.botMentionForumId,
  });
  const channelNamesLinkified = linkifyChannelNames(botMentionsLinkified);
  return linkifyUrls(channelNamesLinkified);
});

const shownText = computed(() => {
  if (showFullText.value) {
    return linkifiedMarkdown.value;
  }
  const words = linkifiedMarkdown.value.split(' ');
  if (words.length > props.wordLimit) {
    return (
      words.slice(0, props.wordLimit).join(' ') +
      (words.length > props.wordLimit ? '...' : '')
    );
  }
  return linkifiedMarkdown.value;
});

const handleImageClick = (event: MouseEvent) => {
  if (props.disableGallery) {
    return;
  }
  const target = event.target as HTMLElement;
  if (target.tagName === 'IMG') {
    const clickedSrc = (target as HTMLImageElement).src;
    const clickedIndex = embeddedImages.value.findIndex(
      (image: GalleryItem) => image.href === clickedSrc
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

const showWarningModal = ref(false);
const pendingUrl = ref('');

const handleClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;

  // Handle image clicks
  if (target.tagName === 'IMG') {
    if (props.disableGallery || !props.allowImages) {
      return;
    }
    const clickedSrc = target.getAttribute('src');
    if (clickedSrc) {
      const clickedIndex = embeddedImages.value.findIndex(
        (image: GalleryItem) => image.href === clickedSrc
      );
      if (clickedIndex !== -1) {
        indexRef.value = clickedIndex;
        visibleRef.value = true;
      }
    }
    return;
  }

  // Handle link clicks
  const link = target.tagName === 'A' ? target : target.closest('a');
  if (link && link instanceof HTMLAnchorElement && link.href) {
    // Only show warning for external links
    const isExternalLink =
      !link.href.startsWith(window.location.origin) &&
      !link.href.startsWith(config.baseUrl);

    if (isExternalLink) {
      event.preventDefault();
      pendingUrl.value = link.href;
      showWarningModal.value = true;
    }
  }
};

const handleModalConfirm = () => {
  if (pendingUrl.value) {
    window.open(pendingUrl.value, '_blank', 'noopener,noreferrer');
  }
  showWarningModal.value = false;
};

const handleModalClose = () => {
  showWarningModal.value = false;
  pendingUrl.value = '';
};
</script>

<template>
  <div class="dark:text-white" @click="handleClick">
    <MarkdownRenderer
      :text="`${shownText}${!showFullText ? '...' : ''}`"
      :class="[{ clickable: !disableGallery && allowImages }]"
      :font-size="fontSize"
      :image-max-height="imageMaxHeight"
      :allow-images="allowImages"
      @click="handleImageClick"
    />
    <button
      v-if="shouldShowMoreButton"
      class="text-sm font-bold text-orange-600 hover:underline dark:text-gray-300"
      @click="toggleShowFullText"
    >
      {{ showFullText ? 'Show Less' : 'Show More' }}
    </button>
    <vue-easy-lightbox
      :visible="visibleRef"
      :imgs="embeddedImages.map((image) => image.src)"
      :index="indexRef"
      @hide="onHide"
    />
    <WarningModal
      data-testid="external-link-warning"
      title="Open External Link"
      :body="`You're about to visit an external website: ${pendingUrl}. Verify links before sharing personal information.`"
      :open="showWarningModal"
      :loading="false"
      :primary-button-text="'Continue'"
      @close="handleModalClose"
      @primary-button-click="handleModalConfirm"
    />
  </div>
</template>
