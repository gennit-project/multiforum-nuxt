<script lang="ts">
  import { computed, defineComponent, ref, watchEffect } from "vue";
  import VueEasyLightbox from "vue-easy-lightbox";
  import MarkdownIt from "markdown-it";
  import { config } from "@/config";
  import MarkdownRenderer from "@/components/MarkdownRenderer.vue";
  import { useUIStore } from "@/stores/uiStore";
  import { storeToRefs } from "pinia";

  function linkifyUsernames(markdownString: string) {
    // First find all email addresses and their positions
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails: { email: string; start: number; end: number }[] = [];
    let match;

    while ((match = emailRegex.exec(markdownString)) !== null) {
      emails.push({
        email: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    // Function to check if a position is within an email
    const isInEmail = (pos: number): boolean => {
      return emails.some((email) => pos >= email.start && pos < email.end);
    };

    // Now find usernames, but skip those within emails
    const regex = /(?<!https?:\/\/(?:[\w.-]+))\b(u\/|@)([a-zA-Z0-9_-]+)/g;
    const parts: string[] = [];
    let lastIndex = 0;

    while ((match = regex.exec(markdownString)) !== null) {
      const matchStart = match.index;

      // Skip if this username is part of an email
      if (isInEmail(matchStart)) {
        continue;
      }

      const prefix = match[1]; // 'u/' or '@'
      const username = match[2];

      // Add text before this match
      parts.push(markdownString.substring(lastIndex, matchStart));

      // Add the username as a markdown link
      parts.push(`[${prefix}${username}](${config.baseUrl}u/${username})`);

      lastIndex = matchStart + match[0].length;
    }

    // Add any remaining text
    if (lastIndex < markdownString.length) {
      parts.push(markdownString.substring(lastIndex));
    }

    return parts.join("");
  }

  function linkifyChannelNames(markdownString: string) {
    const regex = /(?<!https?:\/\/(?:[\w.-]+))\bc\/([a-zA-Z0-9_-]+)/g;
    return markdownString.replace(regex, (match, channelName) => {
      return `[${match}](${config.baseUrl}channels/f/${channelName}/discussions)`;
    });
  }

  function linkifyUrls(text: string) {
    const urlRegex = /(?:https?:\/\/|www\.)[^\s/$.?#].[^\s)]+[^\s)]+/g;
    const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/|www\.)[^\s/$.?#].[^\s)]*\)/g;
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
      if (markdownLinks.some((link) => link.includes(url)) || emailRegex.test(url)) {
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
    maxHeight: number
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
      const uiStore = useUIStore();
      const embeddedImages = ref<GalleryItem[]>([]);
      const visibleRef = ref(false);
      const indexRef = ref(0);
      const { fontSize } = storeToRefs(uiStore);

      const countWords = (str: string) => {
        return str.trim().split(/\s+/).length;
      };

      const showFullText = ref(!props.showShowMore || countWords(props.text) < props.wordLimit);

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
              img.width,
              img.height,
              window.innerWidth,
              window.innerHeight
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
      const pendingUrl = ref("");

      const handleClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        // Handle image clicks
        if (target.tagName === "IMG") {
          if (props.disableGallery) {
            return;
          }
          const clickedSrc = target.getAttribute("src");
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
        const link = target.tagName === "A" ? target : target.closest("a");
        if (link && link instanceof HTMLAnchorElement && link.href) {
          // Only show warning for external links
          const isExternalLink =
            !link.href.startsWith(window.location.origin) && !link.href.startsWith(config.baseUrl);

          if (isExternalLink) {
            event.preventDefault();
            pendingUrl.value = link.href;
            showWarningModal.value = true;
          }
        }
      };

      const handleModalConfirm = () => {
        if (pendingUrl.value) {
          window.open(pendingUrl.value, "_blank", "noopener,noreferrer");
        }
        showWarningModal.value = false;
      };

      const handleModalClose = () => {
        showWarningModal.value = false;
        pendingUrl.value = "";
      };

      return {
        embeddedImages,
        fontSize,
        shownText,
        showFullText,
        toggleShowFullText,
        shouldShowMoreButton,
        handleImageClick,
        visibleRef,
        indexRef,
        onHide,
        handleClick,
        showWarningModal,
        pendingUrl,
        handleModalConfirm,
        handleModalClose,
      };
    },
  });
</script>

<template>
  <div
    class="dark:text-white"
    @click="handleClick"
  >
    <MarkdownRenderer
      :class="[{ clickable: !disableGallery }]"
      :font-size="fontSize"
      :text="`${shownText}${!showFullText ? '...' : ''}`"
      @click="handleImageClick"
    />
    <button
      v-if="shouldShowMoreButton"
      class="text-sm font-bold text-blue-600 hover:underline dark:text-gray-300"
      @click="toggleShowFullText"
    >
      {{ showFullText ? "Show Less" : "Show More" }}
    </button>
    <vue-easy-lightbox
      :imgs="embeddedImages.map((image) => image.src)"
      :index="indexRef"
      :visible="visibleRef"
      @hide="onHide"
    />
    <WarningModal
      :body="`You're about to visit an external website: ${pendingUrl}. Verify links before sharing personal information.`"
      data-testid="external-link-warning"
      :loading="false"
      :open="showWarningModal"
      :primary-button-text="'Continue'"
      title="Open External Link"
      @close="handleModalClose"
      @primary-button-click="handleModalConfirm"
    />
  </div>
</template>
