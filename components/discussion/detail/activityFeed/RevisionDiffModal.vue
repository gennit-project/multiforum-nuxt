<script setup lang="ts">
import { ref } from 'vue';
import type { PropType } from 'vue';
import type { TextVersion } from '@/__generated__/graphql';
import GenericModal from '@/components/GenericModal.vue';
import RevisionDiffContent from '@/components/revision/RevisionDiffContent.vue';
import { useMutation } from '@vue/apollo-composable';
import { DELETE_DISCUSSION_BODY_REVISION } from '@/graphQLData/discussion/mutations';

interface VersionData {
  id: string;
  body?: string;
  title?: string;
  createdAt: string;
  editReason?: string | null;
  Author?: {
    username?: string;
  } | null;
}

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  oldVersion: {
    type: Object as PropType<TextVersion | VersionData>,
    required: true,
  },
  newVersion: {
    type: Object as PropType<TextVersion | VersionData>,
    required: true,
  },
  isMostRecent: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  close: [];
  deleted: [deletedId: string];
}>();

const isDeleting = ref(false);

const {
  mutate: deleteTextVersion,
  loading,
  error,
  onDone,
} = useMutation(DELETE_DISCUSSION_BODY_REVISION);

const handleDelete = async () => {
  if (
    confirm(
      'Are you sure you want to redact this revision? This action cannot be undone.'
    )
  ) {
    isDeleting.value = true;
    try {
      await deleteTextVersion({
        textVersionId: props.oldVersion.id,
      });
    } catch {
      isDeleting.value = false;
    }
  }
};

onDone(() => {
  isDeleting.value = false;
  emit('deleted', props.oldVersion.id);
  emit('close');
});

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <GenericModal
    :open="open"
    title="Revision History"
    :error="error ? error.message : ''"
    primary-button-text="Close"
    danger-button-text="Redact revision"
    :danger-button-disabled="
      !oldVersion.id || oldVersion.id === 'current' || isDeleting || loading
    "
    :danger-button-loading="isDeleting || loading"
    :show-secondary-button="false"
    @close="handleClose"
    @primary-button-click="handleClose"
    @danger-button-click="handleDelete"
  >
    <template #icon>
      <i
        class="fa-solid fa-plus-minus text-lg text-orange-600 dark:text-orange-400"
      />
    </template>
    <template #content>
      <RevisionDiffContent
        :old-version="oldVersion"
        :new-version="newVersion"
        :is-most-recent="isMostRecent"
      />
    </template>
  </GenericModal>
</template>
