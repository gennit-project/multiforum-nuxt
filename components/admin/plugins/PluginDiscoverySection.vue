<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable';
import FormRow from '@/components/FormRow.vue';
import { useToast } from '@/composables/useToast';
import { REFRESH_PLUGINS } from '@/graphQLData/admin/mutations';

const toast = useToast();

const emit = defineEmits<{
  (e: 'refreshed'): void;
}>();

const {
  mutate: refreshPluginsMutation,
  loading: refreshPluginsLoading,
  error: refreshPluginsError,
} = useMutation(REFRESH_PLUGINS);

const refreshPlugins = async () => {
  try {
    await refreshPluginsMutation();
    toast.success('Plugins refreshed successfully');
    emit('refreshed');
  } catch (err: any) {
    toast.error(`Error refreshing plugins: ${err.message}`);
  }
};
</script>

<template>
  <FormRow section-title="Plugin Discovery">
    <template #content>
      <div class="my-3 space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Refresh to discover new plugins from configured registries.
        </p>
        <button
          type="button"
          class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          :disabled="refreshPluginsLoading"
          @click="refreshPlugins"
        >
          <i
            class="fa-solid fa-refresh mr-2"
            :class="{ 'animate-spin': refreshPluginsLoading }"
          />
          {{ refreshPluginsLoading ? 'Refreshing...' : 'Refresh Plugins' }}
        </button>
        <div
          v-if="refreshPluginsError"
          class="text-sm text-red-600 dark:text-red-400"
        >
          Error refreshing plugins: {{ refreshPluginsError.message }}
        </div>
      </div>
    </template>
  </FormRow>
</template>
