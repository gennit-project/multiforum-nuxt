<script setup lang="ts">
import { computed } from 'vue';
import draggable from 'vuedraggable';
import type {
  EventPipeline,
  PipelineStep,
  PipelineCondition,
} from '@/utils/pipelineSchema';
import { PIPELINE_EVENTS, PIPELINE_CONDITIONS } from '@/utils/pipelineSchema';

type EventOption = {
  value: string;
  label: string;
  description: string;
  scope: 'server' | 'channel';
};

const props = withDefaults(
  defineProps<{
    pipeline: EventPipeline;
    availablePlugins: { id: string; name: string }[];
    errors?: string[];
    events?: EventOption[];
  }>(),
  {
    errors: () => [],
    // Default to all events if none provided
    events: () => PIPELINE_EVENTS as unknown as EventOption[],
  }
);

const emit = defineEmits<{
  'update:pipeline': [pipeline: EventPipeline];
}>();

// Local steps array for draggable
const steps = computed({
  get: () => props.pipeline.steps,
  set: (newSteps: PipelineStep[]) => {
    emit('update:pipeline', {
      ...props.pipeline,
      steps: newSteps,
    });
  },
});

function updateStopOnFirstFailure(value: boolean) {
  emit('update:pipeline', {
    ...props.pipeline,
    stopOnFirstFailure: value,
  });
}

function updateStep(index: number, updates: Partial<PipelineStep>) {
  const newSteps = [...props.pipeline.steps];
  const currentStep = newSteps[index];
  if (currentStep) {
    newSteps[index] = { ...currentStep, ...updates };
    emit('update:pipeline', {
      ...props.pipeline,
      steps: newSteps,
    });
  }
}

function removeStep(index: number) {
  const newSteps = props.pipeline.steps.filter((_, i) => i !== index);
  emit('update:pipeline', {
    ...props.pipeline,
    steps: newSteps,
  });
}

function addStep() {
  const newSteps = [
    ...props.pipeline.steps,
    {
      plugin: '',
      condition: 'ALWAYS' as PipelineCondition,
      continueOnError: false,
    },
  ];
  emit('update:pipeline', {
    ...props.pipeline,
    steps: newSteps,
  });
}

const eventLabel = computed(() => {
  const event = props.events.find((e) => e.value === props.pipeline.event);
  return event?.label || props.pipeline.event;
});

const eventDescription = computed(() => {
  const event = props.events.find((e) => e.value === props.pipeline.event);
  return event?.description || '';
});
</script>

<template>
  <div class="pipeline-visual-editor space-y-4">
    <!-- Pipeline Header -->
    <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ eventLabel }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ eventDescription }}
          </p>
        </div>
        <label class="flex items-center space-x-2">
          <input
            type="checkbox"
            :checked="pipeline.stopOnFirstFailure"
            aria-label="Stop on first failure"
            class="form-checkbox h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            @change="
              updateStopOnFirstFailure(
                ($event.target as HTMLInputElement).checked
              )
            "
          />
          <span class="text-sm text-gray-700 dark:text-gray-300"
            >Stop on first failure</span
          >
        </label>
      </div>
    </div>

    <!-- Steps List -->
    <div class="space-y-2">
      <draggable
        v-model="steps"
        item-key="plugin"
        handle=".drag-handle"
        ghost-class="opacity-50"
        class="space-y-2"
      >
        <template #item="{ element: step, index }">
          <div
            class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-black"
          >
            <div class="flex items-start gap-4">
              <!-- Drag Handle -->
              <div
                class="drag-handle cursor-move pt-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <i class="fa-solid fa-grip-vertical" />
              </div>

              <!-- Step Number -->
              <div
                class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900"
              >
                <span
                  class="text-sm font-medium text-orange-600 dark:text-orange-300"
                >
                  {{ index + 1 }}
                </span>
              </div>

              <!-- Step Configuration -->
              <div class="flex-1 space-y-3">
                <!-- Plugin Select -->
                <div>
                  <label
                    class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Plugin
                  </label>
                  <select
                    :value="step.plugin"
                    class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    @change="
                      updateStep(index, {
                        plugin: ($event.target as HTMLSelectElement).value,
                      })
                    "
                  >
                    <option value="" disabled>Select a plugin...</option>
                    <option
                      v-for="plugin in availablePlugins"
                      :key="plugin.id"
                      :value="plugin.id"
                    >
                      {{ plugin.name }}
                    </option>
                  </select>
                </div>

                <!-- Condition & Continue on Error -->
                <div class="flex items-center gap-4">
                  <div class="flex-1">
                    <label
                      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Condition
                    </label>
                    <select
                      :value="step.condition || 'ALWAYS'"
                      class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      @change="
                        updateStep(index, {
                          condition: ($event.target as HTMLSelectElement)
                            .value as PipelineCondition,
                        })
                      "
                    >
                      <option
                        v-for="condition in PIPELINE_CONDITIONS"
                        :key="condition.value"
                        :value="condition.value"
                      >
                        {{ condition.label }}
                      </option>
                    </select>
                  </div>

                  <label class="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      :checked="step.continueOnError"
                      aria-label="Continue on error"
                      class="form-checkbox h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      @change="
                        updateStep(index, {
                          continueOnError: ($event.target as HTMLInputElement)
                            .checked,
                        })
                      "
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300"
                      >Continue on error</span
                    >
                  </label>
                </div>
              </div>

              <!-- Remove Button -->
              <button
                type="button"
                class="p-2 text-gray-400 hover:text-red-500"
                title="Remove step"
                @click="removeStep(index)"
              >
                <i class="fa-solid fa-times" />
              </button>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Empty State -->
      <div
        v-if="steps.length === 0"
        class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600"
      >
        <i class="fa-solid fa-plug mb-2 text-3xl text-gray-400" />
        <p class="text-gray-500 dark:text-gray-400">No steps configured</p>
        <p class="text-sm text-gray-400 dark:text-gray-500">
          Add a step to define which plugins run
        </p>
      </div>
    </div>

    <!-- Add Step Button -->
    <button
      type="button"
      class="w-full rounded-lg border-2 border-dashed border-gray-300 p-4 text-gray-500 transition-colors hover:border-orange-500 hover:text-orange-500 dark:border-gray-600"
      @click="addStep"
    >
      <i class="fa-solid fa-plus mr-2" />
      Add Step
    </button>

    <!-- Validation Errors -->
    <div
      v-if="errors && errors.length > 0"
      class="bg-yellow-50 rounded-md p-3 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
    >
      <div class="flex items-start">
        <i class="fa-solid fa-exclamation-circle mr-2 mt-0.5" />
        <div>
          <p class="font-medium">Validation Errors</p>
          <ul class="mt-1 list-inside list-disc space-y-1">
            <li v-for="(error, index) in errors" :key="index">
              {{ error }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
