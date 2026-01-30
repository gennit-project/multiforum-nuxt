<script setup lang="ts">
import type { PropType } from 'vue';
import type { ServerConfigUpdateInput } from '@/__generated__/graphql';
import FormRow from '@/components/FormRow.vue';
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
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <FormRow section-title="Calendar Settings">
      <template #content>
        <div class="space-y-4">
          <!-- Enable Events Checkbox -->
          <div>
            <CheckBox
              :checked="props.formValues?.enableEvents || false"
              :label="'Enable events/calendar tab in individual forums'"
              @update="emit('updateFormValues', { enableEvents: $event })"
            />
          </div>

          <p class="text-sm text-gray-600 dark:text-gray-400">
            When enabled, forum administrators will be able to turn on event
            functionality for their individual forums. This allows users to
            create, share, and manage events with calendar integration.
          </p>

          <div
            v-if="!props.formValues?.enableEvents"
            class="bg-gray-50 rounded-md p-4 dark:bg-gray-800"
          >
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <strong>Note:</strong> When events are disabled, individual forums
              will not be able to enable their calendar/events functionality,
              and existing events will not be accessible through the forum
              interface.
            </p>
          </div>

          <div v-else class="bg-blue-50 rounded-md p-4 dark:bg-blue-900/20">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              <strong>Events Enabled:</strong> Forum administrators can now
              enable events and calendar functionality for their individual
              forums. Users will be able to create events, set schedules, and
              manage calendar activities within forums that have events enabled.
            </p>
          </div>
        </div>
      </template>
    </FormRow>
  </div>
</template>
