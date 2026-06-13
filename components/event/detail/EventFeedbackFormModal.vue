<script lang="ts" setup>
import GenericModal from '@/components/GenericModal.vue';
import ExclamationIcon from '@/components/icons/ExclamationIcon.vue';

withDefaults(defineProps<{
  title?: string;
  body?: string;
  open?: boolean;
  primaryButtonText?: string;
  secondaryButtonText?: string;
}>(), {
  title: 'Are you sure?',
  body: '',
  open: false,
  primaryButtonText: 'Delete',
  secondaryButtonText: 'Cancel',
});
</script>

<template>
  <GenericModal
    :highlight-color="'yellow'"
    :title="title"
    :body="body"
    :open="open"
    :primary-button-text="primaryButtonText"
    :secondary-button-text="secondaryButtonText"
  >
    <ExclamationIcon
      class="h-6 w-6 text-yellow-600 opacity-100"
      aria-hidden="true"
    />
  </GenericModal>
</template>
