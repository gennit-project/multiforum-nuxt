<script setup lang="ts">
import type { PropType } from 'vue';
import type { ServerConfigUpdateInput } from '@/__generated__/graphql';
import FormRow from '@/components/FormRow.vue';
import TextEditor from '@/components/TextEditor.vue';

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

const emit = defineEmits(['updateFormValues']);
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <FormRow section-title="Server Description">
      <template #content>
        <TextEditor
          class="my-3"
          :test-id="'description-input'"
          :initial-value="formValues?.serverDescription || ''"
          :placeholder="'Add server description'"
          :disable-auto-focus="false"
          :allow-image-upload="false"
          @update="$emit('updateFormValues', { serverDescription: $event })"
        />
      </template>
    </FormRow>
  </div>
</template>
