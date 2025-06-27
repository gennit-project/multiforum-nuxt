<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PropType } from 'vue';
import type { Discussion } from '@/__generated__/graphql';

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

// Get the primary downloadable file for display
const primaryFile = computed(() => {
  return props.discussion?.DownloadableFiles?.[0] || null;
});

// Generate attribution text
const attributionText = computed(() => {
  const title = props.discussion.title;
  const author = props.discussion.Author?.username || 'Unknown';
  const url = window.location.href;
  return `"${title}" by ${author} - ${url}`;
});

// Generate share URL (current page)
const shareUrl = computed(() => {
  return window.location.href;
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
    class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md mx-4"
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
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Content -->
      <div class="flex items-start space-x-4">
        <!-- File preview placeholder -->
        <div class="flex-shrink-0">
          <div class="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-800 dark:to-orange-900 rounded-lg border-2 border-dashed border-orange-300 dark:border-orange-600 flex items-center justify-center">
            <svg class="w-8 h-8 text-orange-500 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
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
                  <svg class="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Twitter
                </button>
                <button
                  class="flex items-center px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors whitespace-nowrap"
                  @click="shareToFacebook"
                >
                  <svg class="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
                <button
                  class="flex items-center px-3 py-1.5 text-xs bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors whitespace-nowrap"
                  @click="shareToLinkedIn"
                >
                  <svg class="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </button>
                <button
                  class="flex items-center px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap"
                  :class="linkCopied ? 'bg-green-500 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'"
                  @click="copyLink"
                >
                  <svg v-if="!linkCopied" class="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <svg v-else class="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
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
                  <svg v-if="!attributionCopied" class="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <svg v-else class="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
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