<script setup lang="ts">
import { computed } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import FormRow from '@/components/FormRow.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import PluginPipelineEditor from '@/components/plugins/PluginPipelineEditor.vue';
import { useToast } from '@/composables/useToast';
import { GET_PLUGIN_PIPELINES, GET_INSTALLED_PLUGINS } from '@/graphQLData/admin/queries';
import { UPDATE_PLUGIN_PIPELINES } from '@/graphQLData/admin/mutations';
import type { PipelineConfig } from '@/utils/pipelineSchema';
import {
  parsePipelinesFromBackend,
  transformPipelinesForMutation,
  getAvailablePluginsFromInstalled,
} from '@/utils/pipelineUtils';

// @ts-ignore - definePageMeta is auto-imported by Nuxt
definePageMeta({
  layout: 'default',
});

const serverName = 'default'; // TODO: Get from config
const toast = useToast();

// Queries
const {
  result: pipelinesResult,
  loading: pipelinesLoading,
  error: pipelinesError,
  refetch: refetchPipelines,
} = useQuery(GET_PLUGIN_PIPELINES, { serverName });

const {
  result: installedResult,
  loading: installedLoading,
} = useQuery(GET_INSTALLED_PLUGINS);

// Mutation
const { mutate: updatePipelines, loading: saving } = useMutation(UPDATE_PLUGIN_PIPELINES);

// Computed
const currentPipelines = computed((): PipelineConfig | undefined => {
  const pipelines = pipelinesResult.value?.serverConfigs?.[0]?.pluginPipelines;
  return parsePipelinesFromBackend(pipelines);
});

const availablePlugins = computed(() => {
  const installed = installedResult.value?.getInstalledPlugins || [];
  return getAvailablePluginsFromInstalled(installed);
});

const isLoading = computed(() => pipelinesLoading.value || installedLoading.value);

// Methods
async function handleSave(config: PipelineConfig) {
  try {
    const pipelinesInput = transformPipelinesForMutation(config);
    await updatePipelines({ pipelines: pipelinesInput });
    toast.success('Pipeline configuration saved successfully');
    await refetchPipelines();
  } catch (err: any) {
    toast.error(`Failed to save pipeline: ${err.message}`);
  }
}
</script>

<template>
  <div class="px-8">
    <RequireAuth>
      <template #has-auth>
        <!-- Header -->
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Plugin Pipelines
            </h1>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Configure the order and conditions for plugin execution
            </p>
          </div>
          <NuxtLink
            to="/admin/plugins"
            class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <i class="fa-solid fa-arrow-left mr-2" />
            Back to Plugins
          </NuxtLink>
        </div>

        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="py-8 text-center"
        >
          <div class="inline-flex items-center">
            <i class="fa-solid fa-spinner mr-2 animate-spin" />
            Loading pipeline configuration...
          </div>
        </div>

        <!-- Error State -->
        <div
          v-else-if="pipelinesError"
          class="py-8 text-center"
        >
          <div class="text-red-600 dark:text-red-400">
            Error loading pipelines: {{ pipelinesError.message }}
          </div>
        </div>

        <!-- Main Content -->
        <div
          v-else
          class="space-y-6"
        >
          <!-- Info Banner -->
          <div class="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="fa-solid fa-info-circle text-blue-400" />
              </div>
              <div class="ml-3">
                <h2 class="text-sm font-medium text-blue-800 dark:text-blue-200">
                  About Plugin Pipelines
                </h2>
                <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <p>
                    Pipelines define which plugins run when certain events occur (like file uploads).
                    You can control the execution order and set conditions for when each plugin should run.
                  </p>
                  <ul class="mt-2 list-disc list-inside space-y-1">
                    <li><strong>ALWAYS</strong> - Run regardless of previous step outcome</li>
                    <li><strong>PREVIOUS_SUCCEEDED</strong> - Only run if the previous step passed</li>
                    <li><strong>PREVIOUS_FAILED</strong> - Only run if the previous step failed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- No Plugins Warning -->
          <div
            v-if="availablePlugins.length === 0"
            class="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4"
          >
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="fa-solid fa-exclamation-triangle text-yellow-400" />
              </div>
              <div class="ml-3">
                <h2 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  No Enabled Plugins
                </h2>
                <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>
                    You need to install and enable at least one plugin before configuring pipelines.
                  </p>
                  <NuxtLink
                    to="/admin/plugins"
                    class="mt-2 inline-flex items-center text-yellow-800 dark:text-yellow-200 hover:underline"
                  >
                    Go to Plugin Management
                    <i class="fa-solid fa-arrow-right ml-2" />
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>

          <!-- Pipeline Editor -->
          <FormRow section-title="Pipeline Configuration">
            <template #content>
              <PluginPipelineEditor
                :initial-config="currentPipelines"
                :available-plugins="availablePlugins"
                :saving="saving"
                @save="handleSave"
              />
            </template>
          </FormRow>
        </div>
      </template>
      <template #does-not-have-auth>
        <div class="p-8 dark:text-white">
          You don't have permission to see this page.
        </div>
      </template>
    </RequireAuth>
  </div>
</template>
