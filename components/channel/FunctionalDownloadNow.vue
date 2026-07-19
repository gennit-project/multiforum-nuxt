<script setup lang="ts">
import DownloadNowButton from '@/components/channel/DownloadNowButton.vue';
import { PREPARE_DOWNLOAD } from '@/graphQLData/discussion/mutations';
import { useToastStore } from '@/stores/toastStore';
import { useMutation } from '@vue/apollo-composable';

type PrepareDownloadResult = {
  ready: boolean;
  url?: string | null;
  scanStatus: 'PENDING' | 'CLEAN' | 'INFECTED' | 'SUSPICIOUS' | 'FAILED';
  scanReason?: string | null;
  reviewAccess: boolean;
  message: string;
};

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
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
  label: {
    type: String,
    default: 'Download Now',
  },
});

const emit = defineEmits(['downloaded']);

const toastStore = useToastStore();
const {
  mutate: prepareDownload,
  loading: preparingDownload,
  error: prepareDownloadError,
} = useMutation(PREPARE_DOWNLOAD);

const startBrowserDownload = (url: string) => {
  if (!import.meta.client) return;

  const link = document.createElement('a');
  link.href = url;
  link.download = props.fileName || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handleDownload = async () => {
  if (
    props.disabled ||
    preparingDownload.value ||
    !props.downloadableFileId ||
    !props.discussionId
  ) {
    return;
  }

  const toastId = toastStore.showToast(
    `Checking ${props.fileName || 'download'} for threats…`,
    'info'
  );

  try {
    const response = await prepareDownload({
      downloadableFileId: props.downloadableFileId,
      discussionId: props.discussionId,
    });
    const result = response?.data?.prepareDownload as
      | PrepareDownloadResult
      | undefined;

    if (!result?.ready || !result.url) {
      toastStore.updateToast(toastId, {
        message:
          result?.message ||
          'The security check could not be completed. Please try again.',
        type: 'error',
      });
      return;
    }

    startBrowserDownload(result.url);
    toastStore.updateToast(toastId, {
      message: result.reviewAccess
        ? result.message
        : `No threats found in ${props.fileName || 'the file'} — download started.`,
      type: 'success',
    });
    emit('downloaded');
  } catch {
    toastStore.updateToast(toastId, {
      message:
        prepareDownloadError.value?.message ||
        'The security check could not be completed. Please try again.',
      type: 'error',
    });
  }
};

</script>

<template>
  <DownloadNowButton
    :disabled="disabled || preparingDownload"
    :label="preparingDownload ? 'Checking…' : label"
    @click="handleDownload"
  />
</template>
