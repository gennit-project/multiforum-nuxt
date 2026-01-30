<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import * as yaml from 'js-yaml';
import PipelineYamlEditor from './PipelineYamlEditor.vue';
import PipelineVisualEditor from './PipelineVisualEditor.vue';
import type { PipelineConfig, EventPipeline, PipelineScope } from '@/utils/pipelineSchema';
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
    scope?: PipelineScope;
  }>(),
  {
    initialConfig: undefined,
    scope: 'server',
  }
);

const emit = defineEmits<{
  save: [config: PipelineConfig];
}>();

type EditorMode = 'yaml' | 'visual';

const mode = ref<EditorMode>('yaml');
const yamlContent = ref(getDefaultPipelineYaml(props.scope));
const parsedConfig = ref<PipelineConfig | null>(null);
const parseError = ref<string | null>(null);
const validationErrors = ref<string[]>([]);
const hasUnsavedChanges = ref(false);

// Get events filtered by scope
const scopedEvents = computed(() => getEventsForScope(props.scope));

// Initialize from prop
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
        parsedConfig.value = config;
        validateConfig();
      } catch (e) {
        console.error('Failed to serialize initial config:', e);
      }
    }
  },
  { immediate: true }
);

// Available plugin IDs for autocomplete
const availablePluginIds = computed(() => props.availablePlugins.map((p) => p.id));

// Current pipeline for visual editor (first pipeline or create empty one)
const currentPipeline = computed((): EventPipeline => {
  if (parsedConfig.value?.pipelines?.[0]) {
    return parsedConfig.value.pipelines[0];
  }
  // Use the first event for the current scope as default
  const defaultEvent = scopedEvents.value[0]?.value || 'downloadableFile.created';
  return {
    event: defaultEvent,
    stopOnFirstFailure: false,
    steps: [],
  };
});

// Handle YAML parsing result
function handleParse(config: PipelineConfig | null, error: string | null) {
  parseError.value = error;
  parsedConfig.value = config;
  hasUnsavedChanges.value = true;

  if (config) {
    validateConfig();
  } else {
    validationErrors.value = [];
  }
}

// Validate the current configuration
function validateConfig() {
  if (!parsedConfig.value) {
    validationErrors.value = [];
    return;
  }

  const result = validatePipelineConfig(parsedConfig.value, availablePluginIds.value, props.scope);
  validationErrors.value = result.errors;
}

// Handle visual editor updates
function handleVisualUpdate(pipeline: EventPipeline) {
  const newConfig: PipelineConfig = {
    pipelines: [pipeline],
  };

  parsedConfig.value = newConfig;
  hasUnsavedChanges.value = true;

  // Update YAML content
  try {
    yamlContent.value = yaml.dump(newConfig, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
    });
  } catch (e) {
    console.error('Failed to serialize config:', e);
  }

  validateConfig();
}

// Switch modes
function switchMode(newMode: EditorMode) {
  if (newMode === 'visual' && parseError.value) {
    // Can't switch to visual if YAML is invalid
    return;
  }

  if (mode.value === 'yaml' && newMode === 'visual') {
    // Parse current YAML before switching
    try {
      parsedConfig.value = yaml.load(yamlContent.value) as PipelineConfig;
      validateConfig();
    } catch (e: any) {
      parseError.value = e.message;
      return;
    }
  }

  mode.value = newMode;
}

// Save configuration
function handleSave() {
  if (!parsedConfig.value || parseError.value || validationErrors.value.length > 0) {
    return;
  }

  emit('save', parsedConfig.value);
  hasUnsavedChanges.value = false;
}

// Check if save is possible
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
    <!-- Mode Toggle & Actions -->
    <div class="flex items-center justify-between">
      <div class="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
          :class="
            mode === 'yaml'
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          "
          @click="switchMode('yaml')"
        >
          <i class="fa-solid fa-code mr-2" />
          YAML
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
          :class="
            mode === 'visual'
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          "
          :disabled="!!parseError"
          :title="parseError ? 'Fix YAML errors before switching to visual mode' : ''"
          @click="switchMode('visual')"
        >
          <i class="fa-solid fa-list mr-2" />
          Visual
        </button>
      </div>

      <div class="flex items-center gap-3">
        <span
          v-if="hasUnsavedChanges"
          class="text-sm text-yellow-600 dark:text-yellow-400"
        >
          <i class="fa-solid fa-circle text-xs mr-1" />
          Unsaved changes
        </span>

        <button
          type="button"
          class="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
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
    </div>

    <!-- Editor Area -->
    <div class="min-h-[400px]">
      <!-- YAML Mode -->
      <div v-if="mode === 'yaml'">
        <PipelineYamlEditor
          v-model="yamlContent"
          :available-plugins="availablePluginIds"
          :errors="validationErrors"
          @parse="handleParse"
        />

        <!-- Available Plugins Reference -->
        <div class="mt-4 rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Available Plugins
          </h4>
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

        <!-- Events Reference -->
        <div class="mt-4 rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Available Events
          </h4>
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

      <!-- Visual Mode -->
      <div v-else>
        <PipelineVisualEditor
          :pipeline="currentPipeline"
          :available-plugins="availablePlugins"
          :errors="validationErrors"
          :events="scopedEvents"
          @update:pipeline="handleVisualUpdate"
        />
      </div>
    </div>
  </div>
</template>
