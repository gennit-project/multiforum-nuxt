<script lang="ts" setup>
import { computed, ref, onMounted } from "vue";
import lightGallery from "lightgallery";
import lgMediumZoom from "lightgallery/plugins/mediumZoom";
import "lightgallery/css/lightgallery.css";

import { config } from "@/config";
import MarkdownRenderer from "@/components/MarkdownRenderer.vue";

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

const props = defineProps({
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
});

const showWarningModal = ref(false);
const pendingUrl = ref("");

const countWords = (str: string) => {
  return str.trim().split(/\s+/).length;
};
const showFullText = ref(
  !props.showShowMore || countWords(props.text) < props.wordLimit
);

const shouldShowMoreButton = computed(() => {
  if (!props.showShowMore) return false;
  if (!props.text) return false;
  const words = props.text.split(" ");
  return words.length > props.wordLimit;
});

const toggleShowFullText = () => {
  showFullText.value = !showFullText.value;
};

// Linkify the text
const linkifiedMarkdown = computed(() => {
  const usernamesLinkified = linkifyUsernames(props.text);
  const channelNamesLinkified = linkifyChannelNames(usernamesLinkified);
  return linkifyUrls(channelNamesLinkified);
});

// Decide whether to show truncated text or full
const shownText = computed(() => {
  if (showFullText.value) {
    return linkifiedMarkdown.value;
  }
  const words = linkifiedMarkdown.value.split(" ");
  if (words.length > props.wordLimit) {
    return words.slice(0, props.wordLimit).join(" ") + "...";
  }
  return linkifiedMarkdown.value;
});

// Handle link clicks (show external link warning)
const handleClick = (event: MouseEvent) => {
  // Only handle link clicks
  const target = event.target as HTMLElement;
  const link = target.tagName === "A" ? target : target.closest("a");

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
    window.open(pendingUrl.value, "_blank", "noopener,noreferrer");
  }
  showWarningModal.value = false;
};

const handleModalClose = () => {
  showWarningModal.value = false;
  pendingUrl.value = "";
};
onMounted(() => {
  if (!props.disableGallery) {
    lightGallery(document.querySelector(".medium-zoom-demo") as HTMLElement, {
      selector: "img",
      plugins: [lgMediumZoom],
    });
  }
});
</script>

<template>
  <div class="medium-zoom-demo dark:text-white" @click="handleClick">
    <MarkdownRenderer
      :text="`${shownText}${!showFullText && shouldShowMoreButton ? '' : ''}`"
      :class="[{ clickable: !disableGallery }]"
    />
    <button
      v-if="shouldShowMoreButton"
      class="ml-4 text-sm font-bold text-blue-600 hover:underline dark:text-gray-300"
      @click="toggleShowFullText"
    >
      {{ showFullText ? "Show Less" : "Show More" }}
    </button>

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
