<script setup lang="ts">
import type { PropType } from 'vue';
import type { ServerConfigUpdateInput } from '@/__generated__/graphql';
import FormRow from '@/components/FormRow.vue';

defineProps({
  editMode: {
    type: Boolean,
    required: true,
  },
  formValues: {
    type: Object as PropType<ServerConfigUpdateInput | null>,
    default: null,
  },
});

const emit = defineEmits<{
  updateFormValues: [value: ServerConfigUpdateInput];
}>();

type BooleanUpdate = {
  field: 'accountAgeGateEnabled' | 'sensitiveContentAgeGateEnabled';
  event: Event;
};
type MinimumAgeUpdate = {
  field: 'minimumAccountAge' | 'minimumSensitiveContentAge';
  event: Event;
};

const updateBoolean = ({ field, event }: BooleanUpdate) => {
  emit('updateFormValues', {
    [field]: (event.target as HTMLInputElement).checked,
  });
};

const updateMinimumAge = ({ field, event }: MinimumAgeUpdate) => {
  const value = (event.target as HTMLInputElement).valueAsNumber;
  if (Number.isInteger(value) && value >= 1 && value <= 120) {
    emit('updateFormValues', { [field]: value });
  }
};
</script>

<template>
  <div class="space-y-6">
    <FormRow section-title="Account age requirement">
      <template #content>
        <div class="space-y-3">
          <label class="flex items-start gap-3 text-sm dark:text-gray-200">
            <input
              id="account-age-gate-enabled"
              type="checkbox"
              class="mt-0.5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              :checked="formValues?.accountAgeGateEnabled || false"
              @change="
                updateBoolean({ field: 'accountAgeGateEnabled', event: $event })
              "
            />
            <span>
              Require age verification before account creation
              <span class="mt-1 block text-xs text-gray-600 dark:text-gray-400">
                People younger than the configured age cannot create an account.
              </span>
            </span>
          </label>
          <div>
            <label
              for="minimum-account-age"
              class="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Minimum account age
            </label>
            <input
              id="minimum-account-age"
              type="number"
              min="1"
              max="120"
              class="mt-1 w-24 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800"
              :value="formValues?.minimumAccountAge ?? 13"
              @input="
                updateMinimumAge({ field: 'minimumAccountAge', event: $event })
              "
            />
          </div>
        </div>
      </template>
    </FormRow>

    <FormRow section-title="Sensitive content age requirement">
      <template #content>
        <div class="space-y-3">
          <label class="flex items-start gap-3 text-sm dark:text-gray-200">
            <input
              id="sensitive-content-age-gate-enabled"
              type="checkbox"
              class="mt-0.5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              :checked="formValues?.sensitiveContentAgeGateEnabled || false"
              @change="
                updateBoolean({
                  field: 'sensitiveContentAgeGateEnabled',
                  event: $event,
                })
              "
            />
            <span>
              Restrict sensitive content by age
              <span class="mt-1 block text-xs text-gray-600 dark:text-gray-400">
                Signed-out people, people without a birthday, and people younger
                than this age cannot access content marked sensitive.
              </span>
            </span>
          </label>
          <div>
            <label
              for="minimum-sensitive-content-age"
              class="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Minimum sensitive content age
            </label>
            <input
              id="minimum-sensitive-content-age"
              type="number"
              min="1"
              max="120"
              class="mt-1 w-24 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800"
              :value="formValues?.minimumSensitiveContentAge ?? 18"
              @input="
                updateMinimumAge({
                  field: 'minimumSensitiveContentAge',
                  event: $event,
                })
              "
            />
          </div>
        </div>
      </template>
    </FormRow>
  </div>
</template>
