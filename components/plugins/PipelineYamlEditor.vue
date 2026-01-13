<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import type { PipelineConfig } from '@/utils/pipelineSchema';
import { pipelineJsonSchema } from '@/utils/pipelineSchema';
import * as yaml from 'js-yaml';

const props = defineProps<{
  modelValue: string;
  availablePlugins?: string[];
  errors?: string[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'parse': [config: PipelineConfig | null, error: string | null];
}>();

const editorContainer = ref<HTMLElement | null>(null);
const editor = shallowRef<any>(null);
const monaco = shallowRef<any>(null);
const parseError = ref<string | null>(null);

// Parse YAML and emit result
function parseYaml(content: string) {
  try {
    const parsed = yaml.load(content) as PipelineConfig;
    parseError.value = null;
    emit('parse', parsed, null);
  } catch (e: any) {
    parseError.value = e.message || 'Invalid YAML';
    emit('parse', null, parseError.value);
  }
}

// Initialize Monaco editor
async function initMonaco() {
  if (!editorContainer.value || typeof window === 'undefined') return;

  // Dynamically import Monaco
  const loader = await import('@monaco-editor/loader');
  monaco.value = await loader.default.init();

  // Configure YAML language
  monaco.value.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemas: [
      {
        uri: 'http://multiforum/pipeline-schema.json',
        fileMatch: ['*'],
        schema: pipelineJsonSchema,
      },
    ],
  });

  // Create editor instance
  editor.value = monaco.value.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: 'yaml',
    theme: document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs',
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    fontSize: 14,
    wordWrap: 'on',
    folding: true,
    renderWhitespace: 'selection',
    quickSuggestions: true,
    suggestOnTriggerCharacters: true,
  });

  // Listen for changes
  editor.value.onDidChangeModelContent(() => {
    const value = editor.value.getValue();
    emit('update:modelValue', value);
    parseYaml(value);
  });

  // Initial parse
  parseYaml(props.modelValue);

  // Watch for theme changes
  const observer = new MutationObserver(() => {
    const isDark = document.documentElement.classList.contains('dark');
    monaco.value?.editor.setTheme(isDark ? 'vs-dark' : 'vs');
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
}

// Update editor value when prop changes externally
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor.value && editor.value.getValue() !== newValue) {
      editor.value.setValue(newValue);
    }
  }
);

// Update available plugins for autocomplete
watch(
  () => props.availablePlugins,
  (plugins) => {
    if (!monaco.value || !plugins) return;

    // Register completion provider for plugin IDs
    monaco.value.languages.registerCompletionItemProvider('yaml', {
      provideCompletionItems: (model: any, position: any) => {
        const lineContent = model.getLineContent(position.lineNumber);

        // Check if we're after "plugin:" on this line
        if (lineContent.includes('plugin:')) {
          const suggestions = plugins.map((pluginId) => ({
            label: pluginId,
            kind: monaco.value.languages.CompletionItemKind.Value,
            insertText: pluginId,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
          }));

          return { suggestions };
        }

        return { suggestions: [] };
      },
    });
  },
  { immediate: true }
);

onMounted(() => {
  initMonaco();
});

onBeforeUnmount(() => {
  editor.value?.dispose();
});
</script>

<template>
  <div class="pipeline-yaml-editor">
    <ClientOnly>
      <div
        ref="editorContainer"
        class="h-96 w-full rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden"
      />
      <template #fallback>
        <div class="h-96 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          <span class="text-gray-500">Loading editor...</span>
        </div>
      </template>
    </ClientOnly>

    <!-- Parse error display -->
    <div
      v-if="parseError"
      class="mt-2 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300"
    >
      <div class="flex items-start">
        <i class="fa-solid fa-exclamation-triangle mr-2 mt-0.5" />
        <div>
          <p class="font-medium">YAML Parse Error</p>
          <p class="mt-1">{{ parseError }}</p>
        </div>
      </div>
    </div>

    <!-- Validation errors -->
    <div
      v-if="errors && errors.length > 0"
      class="mt-2 rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-700 dark:text-yellow-300"
    >
      <div class="flex items-start">
        <i class="fa-solid fa-exclamation-circle mr-2 mt-0.5" />
        <div>
          <p class="font-medium">Validation Errors</p>
          <ul class="mt-1 list-disc list-inside space-y-1">
            <li
              v-for="(error, index) in errors"
              :key="index"
            >
              {{ error }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pipeline-yaml-editor :deep(.monaco-editor) {
  padding-top: 8px;
}
</style>
