<script setup lang="ts">
import type { PropType } from "vue";
import type { ServerConfigUpdateInput } from "@/__generated__/graphql";
import FormRow from "@/components/FormRow.vue";
import CheckBox from "@/components/CheckBox.vue";
import TextInput from "@/components/TextInput.vue";

defineProps({
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

const emit = defineEmits(["updateFormValues"]);
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <FormRow section-title="Download Settings">
      <template #content>
        <div class="space-y-4">
          <CheckBox
            :label="'Enable downloads on this server'"
            :value="formValues?.downloadsEnabled || false"
            @update="$emit('updateFormValues', { downloadsEnabled: $event })"
          />
          
          <div v-if="formValues?.downloadsEnabled">
            <FormRow section-title="Maximum File Size (MB)">
              <template #content>
                <TextInput
                  :placeholder="'Enter maximum file size in MB'"
                  :value="formValues?.maxDownloadSizeMB?.toString() || '100'"
                  type="number"
                  @update="$emit('updateFormValues', { maxDownloadSizeMB: parseInt($event) || 100 })"
                />
              </template>
            </FormRow>
            
            <FormRow section-title="Allowed File Types">
              <template #content>
                <TextInput
                  :placeholder="'Enter allowed file extensions separated by commas (e.g., .pdf,.zip,.txt)'"
                  :value="formValues?.allowedDownloadTypes || '.pdf,.zip,.txt,.doc,.docx'"
                  @update="$emit('updateFormValues', { allowedDownloadTypes: $event })"
                />
              </template>
            </FormRow>
          </div>
        </div>
      </template>
    </FormRow>
  </div>
</template>