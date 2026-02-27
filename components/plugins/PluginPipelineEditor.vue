<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import * as yaml from 'js-yaml';
import PipelineYamlEditor from './PipelineYamlEditor.vue';
import type { PipelineConfig, PipelineConfigScope } from '@/utils/pipelineSchema';
import {
  getDefaultPipelineYaml,
  validatePipelineConfig,
  getEventsForScope,
} from '@/utils/pipelineSchema';

const props = withDefaults(
  defineProps<{
    initialConfig?: PipelineConfig;
    availablePlugins: { id: string; name: string }[];
    saving?: boolean;
    scope?: PipelineConfigScope;
  }>(),
  {
    initialConfig: undefined,
    scope: 'server',
  }
);

const emit = defineEmits<{
  save: [config: PipelineConfig];
}>();

const yamlContent = ref(getDefaultPipelineYaml(props.scope));
const parsedConfig = ref<PipelineConfig | null>(null);
const parseError = ref<string | null>(null);
const validationErrors = ref<string[]>([]);
const hasUnsavedChanges = ref(false);

const availablePluginIds = computed(() => props.availablePlugins.map((p) => p.id));
const scopedEvents = computed(() => getEventsForScope(props.scope));

type ParseOptions = {
  markUnsaved?: boolean;
};

function validateConfig() {
  if (!parsedConfig.value) {
    validationErrors.value = [];
    return;
  }

  const result = validatePipelineConfig(parsedConfig.value, availablePluginIds.value, props.scope);
  validationErrors.value = result.errors;
}

function handleParse(config: PipelineConfig | null, error: string | null, options: ParseOptions = {}) {
  parseError.value = error;
  parsedConfig.value = config;

  if (config) {
    validateConfig();
    if (options.markUnsaved !== false) {
      hasUnsavedChanges.value = true;
    }
  } else {
    validationErrors.value = [];
  }
}

watch(
  () => props.initialConfig,
  (config) => {
    if (config) {
      try {
        yamlContent.value = yaml.dump(config, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
        });
        handleParse(config, null, { markUnsaved: false });
        hasUnsavedChanges.value = false;
      } catch (e) {
        console.error('Failed to serialize initial config:', e);
      }
    } else {
      yamlContent.value = getDefaultPipelineYaml(props.scope);
      parsedConfig.value = null;
      validationErrors.value = [];
      parseError.value = null;
      hasUnsavedChanges.value = false;
    }
  },
  { immediate: true }
);

function handleSave() {
  if (!parsedConfig.value || parseError.value || validationErrors.value.length > 0) {
    return;
  }

  emit('save', parsedConfig.value);
  hasUnsavedChanges.value = false;
}

const canSave = computed(() => {
  return (
    parsedConfig.value &&
    !parseError.value &&
    validationErrors.value.length === 0 &&
    !props.saving
  );
});
</script>

<template>
  <div class="plugin-pipeline-editor space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <span
          v-if="hasUnsavedChanges"
          class="text-sm text-yellow-600 dark:text-yellow-400"
        >
          <i class="fa-solid fa-circle text-xs mr-1" />
          Unsaved changes
        </span>
      </div>

      <button
        type="button"
        class="rounded-md bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!canSave"
        @click="handleSave"
      >
        <i
          v-if="saving"
          class="fa-solid fa-spinner animate-spin mr-2"
        />
        <i
          v-else
          class="fa-solid fa-save mr-2"
        />
        Save Pipeline
      </button>
    </div>

    <div class="min-h-[400px] space-y-6">
      <PipelineYamlEditor
        v-model="yamlContent"
        :errors="validationErrors"
        @parse="handleParse"
      />

      <div class="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Available Plugins
        </h3>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="plugin in availablePlugins"
            :key="plugin.id"
            class="inline-flex items-center rounded-full bg-gray-200 dark:bg-gray-700 px-3 py-1 text-sm"
          >
            <code class="text-orange-600 dark:text-orange-400">{{ plugin.id }}</code>
            <span class="mx-1.5 text-gray-400">-</span>
            <span class="text-gray-600 dark:text-gray-300">{{ plugin.name }}</span>
          </span>
          <span
            v-if="availablePlugins.length === 0"
            class="text-sm text-gray-500"
          >
            No plugins installed. Install plugins first to add them to pipelines.
          </span>
        </div>
      </div>

      <div class="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Available Events
        </h3>
        <div class="space-y-2">
          <div
            v-for="event in scopedEvents"
            :key="event.value"
            class="flex items-start"
          >
            <code class="text-orange-600 dark:text-orange-400 text-sm mr-2">{{ event.value }}</code>
            <span class="text-sm text-gray-600 dark:text-gray-300">- {{ event.description }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
