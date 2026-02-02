<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue';
import TextInput from '@/components/TextInput.vue';
import FormRow from '@/components/FormRow.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

defineProps<{
  isCreating: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', url: string): void;
  (e: 'cancel'): void;
}>();

const imageUrl = ref('');
const urlInputError = ref('');
const urlInputRef = ref<{ focus: () => void } | null>(null);

const isUrlValid = computed(() => {
  if (!imageUrl.value.trim()) return false;
  try {
    new URL(imageUrl.value.trim());
    return true;
  } catch {
    return false;
  }
});

const focusInput = () => {
  nextTick(() => {
    if (urlInputRef.value) {
      urlInputRef.value.focus();
    }
  });
};

const handleSubmit = () => {
  if (!imageUrl.value.trim()) {
    urlInputError.value = 'Please enter a valid URL';
    return;
  }

  try {
    new URL(imageUrl.value);
  } catch {
    urlInputError.value = 'Please enter a valid URL';
    return;
  }

  urlInputError.value = '';
  emit('submit', imageUrl.value.trim());
};

const handleCancel = () => {
  imageUrl.value = '';
  urlInputError.value = '';
  emit('cancel');
};

const setError = (message: string) => {
  urlInputError.value = message;
};

const reset = () => {
  imageUrl.value = '';
  urlInputError.value = '';
};

defineExpose({
  focusInput,
  setError,
  reset,
});
</script>

<template>
  <div
    class="bg-gray-50 mt-4 rounded-md border border-gray-300 p-4 dark:border-gray-600 dark:bg-gray-800"
  >
    <h3 class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
      Add Image from URL
    </h3>
    <div class="mb-3">
      <FormRow section-title="Image URL">
        <template #content>
          <TextInput
            ref="urlInputRef"
            :value="imageUrl"
            placeholder="https://example.com/image.jpg or https://example.com/model.glb"
            @update="(val) => (imageUrl = val)"
          />
        </template>
      </FormRow>
      <p v-if="urlInputError" class="mt-1 text-sm text-red-500">
        {{ urlInputError }}
      </p>
    </div>
    <div class="flex gap-2">
      <button
        type="button"
        class="flex items-center gap-2 rounded bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
        :disabled="!isUrlValid || isCreating"
        :class="{
          'cursor-not-allowed opacity-50': !isUrlValid || isCreating,
        }"
        @click="handleSubmit"
      >
        <LoadingSpinner v-if="isCreating" class="h-4 w-4" />
        {{ isCreating ? 'Creating...' : 'Add Image' }}
      </button>
      <button
        type="button"
        class="rounded bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600"
        @click="handleCancel"
      >
        Cancel
      </button>
    </div>
  </div>
</template>
