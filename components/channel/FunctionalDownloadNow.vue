<script setup lang="ts">
import DownloadNowButton from '@/components/channel/DownloadNowButton.vue';

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
});

const emit = defineEmits(['downloaded']);

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

  setTimeout(() => {
    emit('downloaded');
  }, 500);
};
</script>

<template>
  <DownloadNowButton :disabled="disabled" @click="handleDownload" />
</template>
