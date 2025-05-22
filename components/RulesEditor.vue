<script lang="ts" setup>
  import XmarkIcon from "./icons/XmarkIcon.vue";
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

  const updateRule = (index: number, field: "summary" | "detail", value: string) => {
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
        <span class="mt-3 font-bold dark:text-white">Rule {{ index + 1 }}</span>
        <button
          class="border-orange-500 text-orange-500 mt-2 flex items-center gap-1 rounded border px-2 py-1"
          type="button"
          @click="deleteRule(index)"
        >
          <XmarkIcon class="h-4" />
          Delete Rule
        </button>
      </div>
      <TextInput
        :full-width="true"
        :placeholder="'Rule short name'"
        :test-id="'rule-short-name-input-' + index"
        :value="rule.summary"
        @update="updateRule(index, 'summary', $event)"
      />
      <TextEditor
        :allow-image-upload="false"
        :disable-auto-focus="true"
        :initial-value="rule.detail || ''"
        :placeholder="'Rule details'"
        :rows="4"
        :test-id="'rule-detail-input-' + index"
        @update="updateRule(index, 'detail', $event)"
      />
    </div>
  </div>
  <button
    class="border-orange-500 text-orange-500 mt-2 rounded border px-2 py-1"
    @click="addNewRule"
  >
    + Add New Rule
  </button>
</template>
