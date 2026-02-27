<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { PipelineConfig } from '@/utils/pipelineSchema';
import * as yaml from 'js-yaml';
import { Codemirror } from 'vue-codemirror';
import { basicSetup } from 'codemirror';
import { yaml as yamlLang } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  modelValue: string;
  errors?: string[];
  availablePlugins?: string[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  parse: [config: PipelineConfig | null, error: string | null];
}>();

const uiStore = useUIStore();
const { theme } = storeToRefs(uiStore);
const isDarkMode = computed(() => theme.value === 'dark');

const parseError = ref<string | null>(null);
const editorValue = ref(props.modelValue);

function handleEditorReady(payload: { view: EditorView }) {
  // Make the scroller focusable for keyboard accessibility
  if (payload.view?.scrollDOM) {
    payload.view.scrollDOM.setAttribute('tabindex', '0');
  }
}
const extensions = computed(() => {
  const baseExtensions = [
    basicSetup,
    yamlLang(),
    EditorView.contentAttributes.of({
      'aria-label': 'Pipeline YAML configuration editor',
    }),
  ];
  if (isDarkMode.value) {
    baseExtensions.push(oneDark);
  }
  return baseExtensions;
});
let syncingFromProps = false;

function parseYaml(content: string) {
  try {
    const parsed = yaml.load(content) as PipelineConfig;
    parseError.value = null;
    emit('parse', parsed, null);
  } catch (err: any) {
    parseError.value = err?.message || 'Invalid YAML';
    emit('parse', null, parseError.value);
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue === editorValue.value) return;
    syncingFromProps = true;
    editorValue.value = newValue;
    parseYaml(newValue);
    syncingFromProps = false;
  },
  { immediate: true }
);

watch(editorValue, (value) => {
  if (syncingFromProps) return;
  emit('update:modelValue', value);
  parseYaml(value);
});
</script>

<template>
  <div class="pipeline-yaml-editor">
    <ClientOnly>
      <Codemirror
        v-model="editorValue"
        :extensions="extensions"
        :style="{ height: '384px' }"
        class="w-full rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden"
        placeholder="Pipeline configuration..."
        :indent-with-tab="true"
        :tab-size="2"
        @ready="handleEditorReady"
      />
      <template #fallback>
        <div class="h-96 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          <span class="text-gray-500">Loading editor...</span>
        </div>
      </template>
    </ClientOnly>

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
