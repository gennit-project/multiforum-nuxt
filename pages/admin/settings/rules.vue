<script setup lang="ts">
import type { PropType } from 'vue';
import type { ServerConfigUpdateInput } from '@/__generated__/graphql';
import FormRow from '@/components/FormRow.vue';
import RulesEditor from '@/components/RulesEditor.vue';

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
    <FormRow section-title="Forum Rules">
      <template #content>
        <RulesEditor
          :form-values="{ rules: formValues?.rules || [] }"
          @update-form-values="$emit('updateFormValues', $event)"
        />
      </template>
    </FormRow>
  </div>
</template>
