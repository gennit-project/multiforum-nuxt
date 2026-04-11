<script setup lang="ts">
import { ref } from 'vue';
import GenericModal from '@/components/GenericModal.vue';
import RevisionDiffContent from '@/components/revision/RevisionDiffContent.vue';
import { useMutation } from '@vue/apollo-composable';
import { DELETE_TEXT_VERSION } from '@/graphQLData/discussion/mutations';

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  oldVersion: {
    type: Object,
    required: true,
  },
  newVersion: {
    type: Object,
    required: true,
  },
  isMostRecent: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'deleted']);

const isDeleting = ref(false);

const {
  mutate: deleteTextVersion,
  loading,
  error,
  onDone,
} = useMutation(DELETE_TEXT_VERSION, {
  update: (cache, { data }) => {
    if (data?.deleteTextVersions?.nodesDeleted) {
      cache.evict({ id: `TextVersion:${props.oldVersion.id}` });
      cache.gc();
    }
  },
});

onDone(() => {
  isDeleting.value = false;
  emit('deleted', props.oldVersion.id);
  emit('close');
});

const handleDelete = async () => {
  if (
    confirm(
      'Are you sure you want to delete this revision? This action cannot be undone.'
    )
  ) {
    isDeleting.value = true;
    try {
      await deleteTextVersion({
        id: props.oldVersion.id,
      });
    } catch (err) {
      console.error('Error deleting revision:', err);
      isDeleting.value = false;
    }
  }
};

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <GenericModal
    :open="open"
    title="Wiki Revision History"
    :error="error ? error.message : ''"
    :loading="isDeleting || loading"
    primary-button-text="Delete"
    :primary-button-disabled="!oldVersion.id || oldVersion.id === 'current'"
    highlight-color="red"
    @close="handleClose"
    @primary-button-click="handleDelete"
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
