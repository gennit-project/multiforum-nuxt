<script setup lang="ts">
import GenericModal from '@/components/GenericModal.vue';
import FlagIcon from '@/components/icons/FlagIcon.vue';
import TextEditor from '@/components/TextEditor.vue';

withDefaults(
  defineProps<{
    body?: string;
    open?: boolean;
  }>(),
  {
    body: '',
    open: false,
  }
);

function updateFeedback() {}
</script>
<template>
  <GenericModal
    :highlight-color="'red'"
    :title="'Report Event'"
    :body="'Why should this event be removed? Please be specific about any rule violations.'"
    :open="open"
    :primary-button-text="'Submit'"
    :secondary-button-text="'Cancel'"
  >
    <template #icon>
      <FlagIcon class="h-6 w-6 text-red-600 opacity-100" aria-hidden="true" />
    </template>
    <template #content>
      <TextEditor
        :test-id="'event-report-input'"
        :initial-value="''"
        :placeholder="'Explain why this event should be removed'"
        :disable-auto-focus="false"
        :allow-image-upload="false"
        @update="updateFeedback"
      />
    </template>
  </GenericModal>
</template>
