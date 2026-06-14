<script setup lang="ts">
import DownloadNowButton from '@/components/channel/DownloadNowButton.vue';
import { TRACK_DOWNLOAD } from '@/graphQLData/discussion/mutations';
import { useMutation } from '@vue/apollo-composable';

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  url: {
    type: String,
    default: '',
  },
  fileName: {
    type: String,
    default: 'download',
  },
  downloadableFileId: {
    type: String,
    default: '',
  },
  discussionId: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['downloaded']);

const { mutate: trackDownload } = useMutation(TRACK_DOWNLOAD);

const handleDownload = () => {
  if (props.disabled || !props.url) {
    console.error('No download URL available');
    return;
  }

  if (import.meta.client) {
    const link = document.createElement('a');
    link.href = props.url;
    link.download = props.fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (props.downloadableFileId && props.discussionId) {
    trackDownload({
      downloadableFileId: props.downloadableFileId,
      discussionId: props.discussionId,
    }).catch((error) => {
      console.error('Failed to track download', error);
    });
  }

  setTimeout(() => {
    emit('downloaded');
  }, 500);
};
</script>

<template>
  <DownloadNowButton :disabled="disabled" @click="handleDownload" />
</template>
