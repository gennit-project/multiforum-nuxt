<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import type { Discussion } from '@/__generated__/graphql';
import CloseIcon from '@/components/icons/CloseIcon.vue';
import DownloadFileIcon from '@/components/icons/DownloadFileIcon.vue';
import TwitterIcon from '@/components/icons/TwitterIcon.vue';
import FacebookIcon from '@/components/icons/FacebookIcon.vue';
import LinkedInIcon from '@/components/icons/LinkedInIcon.vue';
import RedditIcon from '@/components/icons/RedditIcon.vue';
import DiscordIcon from '@/components/icons/DiscordIcon.vue';
import BlueskyIcon from '@/components/icons/BlueskyIcon.vue';
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
  const author = props.discussion.Author?.username || 'Unknown';
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
  const text = encodeURIComponent(`Check out this download: ${props.discussion.title}`);
  const url = encodeURIComponent(shareUrl.value);
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420');
};

const shareToFacebook = () => {
  const url = encodeURIComponent(shareUrl.value);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=550,height=420');
};

const shareToLinkedIn = () => {
  const url = encodeURIComponent(shareUrl.value);
  const title = encodeURIComponent(props.discussion.title);
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank', 'width=550,height=420');
};

const shareToReddit = () => {
  const url = encodeURIComponent(shareUrl.value);
  const title = encodeURIComponent(props.discussion.title);
  window.open(`https://reddit.com/submit?url=${url}&title=${title}`, '_blank', 'width=550,height=420');
};

const shareToBluesky = () => {
  const text = encodeURIComponent(`Check out this download: ${props.discussion.title}`);
  const url = encodeURIComponent(shareUrl.value);
  window.open(`https://bsky.app/intent/compose?text=${text} ${url}`, '_blank', 'width=550,height=420');
};

const shareToDiscord = () => {
  // Discord doesn't have a direct web share API, so we copy a formatted message
  const shareText = `Check out this download: **${props.discussion.title}**\n${shareUrl.value}`;
  
  navigator.clipboard.writeText(shareText).then(() => {
    discordCopied.value = true;
    setTimeout(() => {
      discordCopied.value = false;
    }, 2000);
  }).catch((err) => {
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
    class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl mx-4"
  >
    <!-- Backdrop for mobile -->
    <div 
      class="fixed inset-0 bg-black bg-opacity-20 sm:hidden"
      @click="emit('close')"
    />
    
    <!-- Popover content -->
    <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6">
      <!-- Close button -->
      <button
        class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        @click="emit('close')"
      >
        <CloseIcon />
      </button>

      <!-- Content -->
      <div class="flex items-start space-x-4">
        <!-- File preview placeholder -->
        <div class="flex-shrink-0">
          <div class="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-800 dark:to-orange-900 rounded-lg border-2 border-dashed border-orange-300 dark:border-orange-600 flex items-center justify-center">
            <DownloadFileIcon />
          </div>
          <div class="text-xs text-center mt-1 text-gray-500 dark:text-gray-400 truncate w-16">
            {{ primaryFile?.fileName || 'File' }}
          </div>
        </div>

        <!-- Main content -->
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Say thanks! Give a shout-out...
          </h3>
          
          <!-- Share buttons -->
          <div class="space-y-3">
            <!-- Social sharing -->
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">Share this download:</p>
              <div class="flex flex-wrap gap-2">
                <button
                  class="flex items-center px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors whitespace-nowrap"
                  @click="shareToTwitter"
                >
                  <TwitterIcon />
                  Twitter
                </button>
                <button
                  class="flex items-center px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors whitespace-nowrap"
                  @click="shareToFacebook"
                >
                  <FacebookIcon />
                  Facebook
                </button>
                <button
                  class="flex items-center px-3 py-1.5 text-xs bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors whitespace-nowrap"
                  @click="shareToLinkedIn"
                >
                  <LinkedInIcon />
                  LinkedIn
                </button>
                <button
                  class="flex items-center px-3 py-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors whitespace-nowrap"
                  @click="shareToReddit"
                >
                  <RedditIcon />
                  Reddit
                </button>
                <button
                  class="flex items-center px-3 py-1.5 text-xs bg-sky-500 hover:bg-sky-600 text-white rounded-md transition-colors whitespace-nowrap"
                  @click="shareToBluesky"
                >
                  <BlueskyIcon />
                  Bluesky
                </button>
                <button
                  class="flex items-center px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap"
                  :class="discordCopied ? 'bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'"
                  @click="shareToDiscord"
                >
                  <DiscordIcon v-if="!discordCopied" />
                  <CheckIcon v-else />
                  {{ discordCopied ? 'Copied!' : 'Discord' }}
                </button>
                <button
                  class="flex items-center px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap"
                  :class="linkCopied ? 'bg-green-500 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'"
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
              <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">Copy attribution:</p>
              <div class="flex items-center space-x-2">
                <div class="flex-1 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300 truncate">
                  {{ attributionText }}
                </div>
                <button
                  class="flex items-center px-3 py-2 text-xs rounded-md transition-colors flex-shrink-0 whitespace-nowrap"
                  :class="attributionCopied ? 'bg-green-500 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'"
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