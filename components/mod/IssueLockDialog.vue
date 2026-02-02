<script lang="ts" setup>
import GenericButton from '@/components/GenericButton.vue';
import SaveButton from '@/components/SaveButton.vue';

const props = defineProps<{
  lockReasonInput: string;
  lockIssueLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:lockReasonInput', value: string): void;
  (e: 'close'): void;
  (e: 'lock'): void;
}>();

const handleReasonUpdate = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit('update:lockReasonInput', target.value);
};
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click.self="emit('close')"
  >
    <div
      class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
    >
      <h3 class="mb-4 text-lg font-bold dark:text-white">Lock Issue</h3>
      <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Locking an issue prevents further modifications including comments,
        status changes, and edits.
      </p>
      <label class="mb-2 block text-sm font-medium dark:text-gray-300">
        Reason for locking (required)
      </label>
      <textarea
        :value="props.lockReasonInput"
        class="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        rows="3"
        placeholder="Enter the reason for locking this issue..."
        @input="handleReasonUpdate"
      />
      <div class="mt-4 flex justify-end gap-2">
        <GenericButton :text="'Cancel'" @click="emit('close')" />
        <SaveButton
          :label="'Lock Issue'"
          :disabled="!props.lockReasonInput.trim() || props.lockIssueLoading"
          :loading="props.lockIssueLoading"
          @click="emit('lock')"
        />
      </div>
    </div>
  </div>
</template>
