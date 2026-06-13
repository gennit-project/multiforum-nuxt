<script lang="ts" setup>
import GenericModal from '@/components/GenericModal.vue';
import ExclamationIcon from '@/components/icons/ExclamationIcon.vue';

withDefaults(defineProps<{
  title?: string;
  body?: string;
  open?: boolean;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  icon?: string;
  error?: string;
  loading?: boolean;
  dataTestid?: string;
}>(), {
  title: 'Are you sure?',
  body: '',
  open: false,
  primaryButtonText: 'Delete',
  secondaryButtonText: 'Cancel',
  icon: 'ExclamationIcon',
  error: '',
  loading: false,
  dataTestid: '',
});
</script>

<template>
  <GenericModal
    :data-testid="dataTestid"
    :highlight-color="'yellow'"
    :title="title"
    :body="body"
    :open="open"
    :primary-button-text="primaryButtonText"
    :secondary-button-text="secondaryButtonText"
    :error="error"
    :loading="loading"
  >
    <template #icon>
      <i v-if="icon === 'trash'" class="fas fa-trash-alt dark:text-gray-100" />
      <ExclamationIcon v-else class="dark:text-gray-100" />
    </template>
  </GenericModal>
</template>
