<script lang="ts" setup>
import ErrorBanner from '@/components/ErrorBanner.vue';
import GenericButton from '@/components/GenericButton.vue';
import SaveButton from '@/components/SaveButton.vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import TextEditor from '@/components/TextEditor.vue';

const props = defineProps<{
  issueId?: string;
  issueBody?: string | null;
  isIssueAuthor: boolean;
  isLocked: boolean;
  isEditingIssueBody: boolean;
  editedIssueBody: string;
  updateIssueBodyLoading: boolean;
  updateIssueBodyError?: { message: string } | null;
  issueBodyHasChanges: boolean;
}>();

const emit = defineEmits<{
  (e: 'startEdit'): void;
  (e: 'cancelEdit'): void;
  (e: 'saveEdit'): void;
  (e: 'update:editedIssueBody', value: string): void;
}>();
</script>

<template>
  <div class="py-2">
    <div class="mb-2 flex items-center justify-between gap-2">
      <h3 class="text-lg font-semibold">Issue details</h3>
      <div v-if="isIssueAuthor && !isLocked" class="flex items-center gap-2">
        <GenericButton
          v-if="!isEditingIssueBody"
          :text="'Edit'"
          @click="emit('startEdit')"
        />
        <template v-else>
          <GenericButton :text="'Cancel'" @click="emit('cancelEdit')" />
          <SaveButton
            :label="'Save'"
            :disabled="
              updateIssueBodyLoading ||
              !editedIssueBody.trim() ||
              !issueBodyHasChanges
            "
            :loading="updateIssueBodyLoading"
            @click="emit('saveEdit')"
          />
        </template>
      </div>
    </div>
    <MarkdownPreview
      v-if="issueBody && !isEditingIssueBody"
      :text="issueBody"
      :word-limit="1000"
      :disable-gallery="true"
    />
    <div v-else-if="isEditingIssueBody" class="space-y-2">
      <TextEditor
        :key="`issue-body-editor-${issueId}`"
        :rows="6"
        :placeholder="'Update the issue details...'"
        :initial-value="editedIssueBody"
        @update="emit('update:editedIssueBody', $event)"
      />
    </div>
    <ErrorBanner
      v-if="updateIssueBodyError"
      class="mt-2"
      :text="updateIssueBodyError.message"
    />
  </div>
</template>
