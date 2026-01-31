<script setup lang="ts">
import { computed } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import FormRow from '@/components/FormRow.vue';
import PluginPipelineEditor from '@/components/plugins/PluginPipelineEditor.vue';
import { useToast } from '@/composables/useToast';
import { GET_CHANNEL_PLUGIN_PIPELINES } from '@/graphQLData/channel/queries';
import { UPDATE_CHANNEL_PLUGIN_PIPELINES } from '@/graphQLData/channel/mutations';
import { GET_INSTALLED_PLUGINS } from '@/graphQLData/admin/queries';
import type { PipelineConfig, EventPipeline } from '@/utils/pipelineSchema';
import { useRoute } from 'nuxt/app';

const route = useRoute();
const toast = useToast();

const channelUniqueName = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

// Query for channel pipeline configuration
const {
  result: pipelinesResult,
  loading: pipelinesLoading,
  error: pipelinesError,
  refetch: refetchPipelines,
} = useQuery(
  GET_CHANNEL_PLUGIN_PIPELINES,
  () => ({ channelUniqueName: channelUniqueName.value }),
  { enabled: computed(() => !!channelUniqueName.value) }
);

// Query for installed plugins (only enabled server plugins can be used)
const {
  result: installedResult,
  loading: installedLoading,
} = useQuery(GET_INSTALLED_PLUGINS);

// Mutation
const { mutate: updatePipelines, loading: saving } = useMutation(UPDATE_CHANNEL_PLUGIN_PIPELINES);

// Computed
const currentPipelines = computed((): PipelineConfig | undefined => {
  let pipelines = pipelinesResult.value?.channels?.[0]?.pluginPipelines;

  // Handle JSON string from Neo4j storage
  if (typeof pipelines === 'string') {
    try {
      pipelines = JSON.parse(pipelines);
    } catch {
      return undefined;
    }
  }

  if (pipelines && Array.isArray(pipelines)) {
    return { pipelines };
  }
  return undefined;
});

const channelDisplayName = computed(() => {
  return pipelinesResult.value?.channels?.[0]?.displayName || channelUniqueName.value;
});

// Only show plugins that are enabled at server level
// Use plugin.name (slug) as the ID for pipeline configuration, not the UUID
const availablePlugins = computed(() => {
  const installed = installedResult.value?.getInstalledPlugins || [];
  return installed
    .filter((p: any) => p.enabled)
    .map((p: any) => ({
      id: p.plugin.name,
      name: p.plugin.displayName || p.plugin.name,
    }));
});

const isLoading = computed(() => pipelinesLoading.value || installedLoading.value);

// Methods
async function handleSave(config: PipelineConfig) {
  try {
    // Transform to the input format expected by the mutation
    const pipelinesInput = config.pipelines.map((pipeline: EventPipeline) => ({
      event: pipeline.event,
      stopOnFirstFailure: pipeline.stopOnFirstFailure || false,
      steps: pipeline.steps.map((step) => ({
        pluginId: step.plugin,
        condition: step.condition || 'ALWAYS',
        continueOnError: step.continueOnError || false,
      })),
    }));

    await updatePipelines({
      channelUniqueName: channelUniqueName.value,
      pipelines: pipelinesInput,
    });
    toast.success('Channel pipeline configuration saved successfully');
    await refetchPipelines();
  } catch (err: any) {
    toast.error(`Failed to save pipeline: ${err.message}`);
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">
        Plugin Pipelines
      </h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Configure plugin execution when content is submitted to {{ channelDisplayName }}
      </p>
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
            <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
              About Channel Pipelines
            </h3>
            <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                Channel pipelines run when content with downloads is submitted to this forum.
                Only plugins that are enabled at the server level can be used here.
              </p>
              <ul class="mt-2 list-disc list-inside space-y-1">
                <li><strong>discussionChannel.created</strong> - When a download is submitted to this forum</li>
              </ul>
              <p class="mt-2 text-xs">
                Server pipelines run first (for security scanning), then channel pipelines run.
              </p>
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
            <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              No Server Plugins Available
            </h3>
            <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>
                Channel pipelines can only use plugins that are enabled at the server level.
                Contact a server administrator to enable plugins.
              </p>
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
            scope="channel"
            @save="handleSave"
          />
        </template>
      </FormRow>
    </div>
  </div>
</template>
