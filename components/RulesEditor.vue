<script lang="ts" setup>
import XmarkIcon from './icons/XmarkIcon.vue';
const props = defineProps<{
  formValues: {
    rules: {
      summary: string;
      detail: string;
    }[];
  };
}>();

const emit = defineEmits(["updateFormValues"]);

type RuleInput = {
  summary: string;
  detail: string;
};

const updateRule = (
  index: number,
  field: "summary" | "detail",
  value: string
) => {
  const updatedRules: RuleInput[] = [...(props.formValues?.rules || [])];
  updatedRules[index][field] = value;
  emit("updateFormValues", { rules: updatedRules });
};

const addNewRule = (event: Event) => {
  event.preventDefault();
  const newRule = { summary: "", detail: "" };
  const updatedRules = [...(props.formValues?.rules || []), newRule];
  emit("updateFormValues", { rules: updatedRules });
};

const deleteRule = (index: number) => {
  const updatedRules = [...(props.formValues?.rules || [])];
  updatedRules.splice(index, 1);
  emit("updateFormValues", { rules: updatedRules });
};
</script>
<template>
  <div class="divide-y divide-gray-500">
    <div
      v-for="(rule, index) in formValues.rules"
      :key="index"
      class="mb-4 flex flex-col gap-2"
    >
      <div class="flex justify-between">
        <span class="font-bold mt-3 dark:text-white">Rule {{ index + 1 }}</span>
        <button
<<<<<<< HEAD
          class="mt-2 flex items-center gap-1 rounded border border-orange-600 px-2 py-1 text-orange-600"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
          type="button"
          class="mt-2 rounded border border-blue-500 px-2 py-1 text-blue-500 flex items-center gap-1"
          @click="deleteRule(index)"
        >
          <XmarkIcon class="h-4" />
          Delete Rule
        </button>
      </div>
      <TextInput
        :test-id="'rule-short-name-input-' + index"
        :value="rule.summary"
        :placeholder="'Rule short name'"
        :full-width="true"
        @update="updateRule(index, 'summary', $event)"
      />
      <TextEditor
        :test-id="'rule-detail-input-' + index"
        :initial-value="rule.detail || ''"
        :placeholder="'Rule details'"
        :rows="4"
        :disable-auto-focus="true"
        :allow-image-upload="false"
        @update="updateRule(index, 'detail', $event)"
      />
    </div>
  </div>
  <button
    class="mt-2 rounded border border-orange-600 px-2 py-1 text-orange-600"
    @click="addNewRule"
  >
    + Add New Rule
  </button>
</template>
