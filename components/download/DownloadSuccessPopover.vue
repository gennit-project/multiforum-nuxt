<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import type { Discussion } from '@/__generated__/graphql';
import CloseIcon from '@/components/icons/CloseIcon.vue';
import DownloadFileIcon from '@/components/icons/DownloadFileIcon.vue';
import TwitterIcon from '@/components/icons/TwitterIcon.vue';
import FacebookIcon from '@/components/icons/FacebookIcon.vue';
import RedditIcon from '@/components/icons/RedditIcon.vue';
// import DiscordIcon from "@/components/icons/DiscordIcon.vue"; // Unused for now
import BlueskyIcon from '@/components/icons/BlueskyIcon.vue';
import PinterestIcon from '@/components/icons/PinterestIcon.vue';
import TumblrIcon from '@/components/icons/TumblrIcon.vue';
import CopyIcon from '@/components/icons/CopyIcon.vue';
import CheckIcon from '@/components/icons/CheckIcon.vue';

const props = defineProps({
  discussion: {
    type: Object as PropType<Discussion>,
    required: true,
  },
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  close: [];
}>();

// Copy feedback state
const linkCopied = ref(false);
const attributionCopied = ref(false);
const discordCopied = ref(false);

// Get the primary downloadable file for display
const primaryFile = computed(() => {
  return props.discussion?.DownloadableFiles?.[0] || null;
});

// Generate attribution text
const attributionText = computed(() => {
  const title = props.discussion.title || 'Untitled';
  const username = props.discussion.Author?.username || 'Unknown';
  const displayName = props.discussion.Author?.displayName;

  // If display name exists, format as "by Catherine Luse (cluse)", otherwise "by cluse"
  const author = displayName ? `${displayName} (${username})` : username;

  const url = typeof window !== 'undefined' ? window.location.href : '';
  return `"${title}" by ${author} - ${url}`;
});

// Generate share URL (current page)
const shareUrl = computed(() => {
  return typeof window !== 'undefined' ? window.location.href : '';
});

const copyAttribution = async () => {
  try {
    await navigator.clipboard.writeText(attributionText.value);
    attributionCopied.value = true;
    setTimeout(() => {
      attributionCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy attribution:', err);
  }
};

const shareToTwitter = () => {
  const text = encodeURIComponent(
    `Check out this download: ${props.discussion.title}`
  );
  const url = encodeURIComponent(shareUrl.value);
  window.open(
    `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    '_blank',
    'width=550,height=420'
  );
};

const shareToFacebook = () => {
  const url = encodeURIComponent(shareUrl.value);
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    '_blank',
    'width=550,height=420'
  );
};

const shareToPinterest = () => {
  const url = encodeURIComponent(shareUrl.value);
  const description = encodeURIComponent(
    `Check out this download: ${props.discussion.title}`
  );
  window.open(
    `https://pinterest.com/pin/create/button/?url=${url}&description=${description}`,
    '_blank',
    'width=550,height=420'
  );
};

const shareToTumblr = () => {
  const url = encodeURIComponent(shareUrl.value);
  window.open(
    `https://www.tumblr.com/widgets/share/tool?shareSource=legacy&canonicalUrl=${url}&posttype=link`,
    '_blank',
    'width=550,height=420'
  );
};

const shareToReddit = () => {
  const url = encodeURIComponent(shareUrl.value);
  const title = encodeURIComponent(props.discussion.title);
  window.open(
    `https://reddit.com/submit?url=${url}&title=${title}`,
    '_blank',
    'width=550,height=420'
  );
};

const shareToBluesky = () => {
  const text = encodeURIComponent(
    `Check out this download: ${props.discussion.title}`
  );
  const url = encodeURIComponent(shareUrl.value);
  window.open(
    `https://bsky.app/intent/compose?text=${text} ${url}`,
    '_blank',
    'width=550,height=420'
  );
};

const _shareToDiscord = () => {
  // Discord doesn't have a direct web share API, so we copy a formatted message
  const shareText = `Check out this download: **${props.discussion.title}**\n${shareUrl.value}`;

  navigator.clipboard
    .writeText(shareText)
    .then(() => {
      discordCopied.value = true;
      setTimeout(() => {
        discordCopied.value = false;
      }, 2000);
    })
    .catch((err) => {
      console.error('Failed to copy Discord message:', err);
    });
};

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    linkCopied.value = true;
    setTimeout(() => {
      linkCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy link:', err);
  }
};
</script>

<template>
  <div
    v-if="visible"
    class="fixed bottom-4 left-1/2 z-50 mx-4 w-full max-w-2xl -translate-x-1/2 transform"
  >
    <!-- Backdrop for mobile -->
    <div
      class="fixed inset-0 bg-black bg-opacity-20 sm:hidden"
      @click="emit('close')"
    />

    <!-- Popover content -->
    <div
      class="relative rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800"
    >
      <!-- Close button -->
      <button
        class="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        @click="emit('close')"
      >
        <CloseIcon />
      </button>

      <!-- Content -->
      <div class="flex items-start space-x-4">
        <!-- File preview placeholder -->
        <div class="flex-shrink-0">
          <div
            class="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-orange-300 bg-gradient-to-br from-orange-100 to-orange-200 dark:border-orange-600 dark:from-orange-800 dark:to-orange-900"
          >
            <DownloadFileIcon />
          </div>
          <div
            class="mt-1 w-16 truncate text-center text-xs text-gray-500 dark:text-gray-400"
          >
            {{ primaryFile?.fileName || 'File' }}
          </div>
        </div>

        <!-- Main content -->
        <div class="min-w-0 flex-1">
          <h3 class="font-semibold mb-2 text-lg text-gray-900 dark:text-white">
            Say thanks! Give a shout-out...
          </h3>

          <!-- Share buttons -->
          <div class="space-y-3">
            <!-- Social sharing -->
            <div>
              <p class="mb-2 text-sm text-gray-600 dark:text-gray-300">
                Share this download:
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  class="flex items-center whitespace-nowrap rounded-md bg-gray-500 px-3 py-1.5 text-xs text-white transition-colors hover:bg-gray-600"
                  @click="shareToTwitter"
                >
                  <TwitterIcon />
                  Twitter
                </button>

                <button
                  class="flex items-center whitespace-nowrap rounded-md bg-gray-500 px-3 py-1.5 text-xs text-white transition-colors hover:bg-gray-600"
                  @click="shareToFacebook"
                >
                  <FacebookIcon />
                  Facebook
                </button>

                <button
                  class="flex items-center whitespace-nowrap rounded-md bg-gray-500 px-3 py-1.5 text-xs text-white transition-colors hover:bg-gray-600"
                  @click="shareToPinterest"
                >
                  <PinterestIcon />
                  Pinterest
                </button>

                <button
                  class="flex items-center whitespace-nowrap rounded-md bg-gray-500 px-3 py-1.5 text-xs text-white transition-colors hover:bg-gray-600"
                  @click="shareToTumblr"
                >
                  <TumblrIcon />
                  Tumblr
                </button>

                <button
                  class="flex items-center whitespace-nowrap rounded-md bg-gray-500 px-3 py-1.5 text-xs text-white transition-colors hover:bg-gray-600"
                  @click="shareToReddit"
                >
                  <RedditIcon />
                  Reddit
                </button>

                <button
                  class="flex items-center whitespace-nowrap rounded-md bg-gray-500 px-3 py-1.5 text-xs text-white transition-colors hover:bg-gray-600"
                  @click="shareToBluesky"
                >
                  <BlueskyIcon />
                  Bluesky
                </button>

                <button
                  class="flex items-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-colors"
                  :class="
                    linkCopied
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  "
                  @click="copyLink"
                >
                  <CopyIcon v-if="!linkCopied" />
                  <CheckIcon v-else />
                  {{ linkCopied ? 'Copied!' : 'Copy Link' }}
                </button>
              </div>
            </div>

            <!-- Attribution -->
            <div>
              <p class="mb-2 text-sm text-gray-600 dark:text-gray-300">
                Copy attribution:
              </p>
              <div class="flex items-center space-x-2">
                <div
                  class="bg-gray-50 flex-1 truncate rounded p-2 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  {{ attributionText }}
                </div>
                <button
                  class="flex flex-shrink-0 items-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-colors"
                  :class="
                    attributionCopied
                      ? 'bg-green-500 text-white'
                      : 'bg-orange-500 text-black hover:bg-orange-600'
                  "
                  @click="copyAttribution"
                >
                  <CopyIcon v-if="!attributionCopied" />
                  <CheckIcon v-else />
                  {{ attributionCopied ? 'Copied!' : 'Copy' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
