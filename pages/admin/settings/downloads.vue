<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';
import type { ServerConfigUpdateInput } from '@/__generated__/graphql';
import FormRow from '@/components/FormRow.vue';
import TextInput from '@/components/TextInput.vue';
import CheckBox from '@/components/CheckBox.vue';

const props = defineProps({
  editMode: {
    type: Boolean,
    required: true,
  },
  formValues: {
    type: Object as PropType<ServerConfigUpdateInput | null>,
    required: false,
    default: null,
  },
});

const emit = defineEmits(['updateFormValues']);

// Convert allowedFileTypes array to comma-separated string for display
const allowedFileTypesString = computed(() => {
  if (!props.formValues?.allowedFileTypes) return '';
  return props.formValues.allowedFileTypes.join(', ');
});

// Convert comma-separated string back to array
const updateAllowedFileTypes = (value: string) => {
  const fileTypes = value
    .split(',')
    .map((type) => type.trim())
    .filter((type) => type.length > 0);

  emit('updateFormValues', { allowedFileTypes: fileTypes });
};
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <FormRow section-title="File Upload Settings">
      <template #content>
        <div class="space-y-4">
          <!-- Enable Downloads Checkbox -->
          <div class="flex items-center space-x-2">
            <CheckBox
              :checked="props.formValues?.enableDownloads || false"
              @update="emit('updateFormValues', { enableDownloads: $event })"
            />
            <label class="text-sm font-medium text-gray-900 dark:text-white">
              Enable downloads tab in individual forums
            </label>
          </div>

          <!-- Allowed File Types Section - Conditional -->
          <FormRow section-title="Allowed File Types">
            <template #content>
              <div class="space-y-2">
                <TextInput
                  :placeholder="'Enter allowed file extensions separated by commas (e.g., .pdf, .zip, .txt, .doc, .docx)'"
                  :value="allowedFileTypesString"
                  :disabled="!props.formValues?.enableDownloads"
                  @update="updateAllowedFileTypes($event)"
                />
                <p
                  v-if="!props.formValues?.enableDownloads"
                  class="text-sm italic text-gray-500 dark:text-gray-500"
                >
                  This input is disabled because downloads are currently
                  disabled. Enable downloads above to configure allowed file
                  types.
                </p>
                <p v-else class="text-sm text-gray-600 dark:text-gray-400">
                  Specify which file types users can upload. Enter the
                  extensions as comma separated values. Include the dot (.)
                  before each extension.
                </p>
              </div>
            </template>
          </FormRow>
        </div>
      </template>
    </FormRow>
  </div>
</template>
