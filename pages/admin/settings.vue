<script setup lang="ts">
import { ref, computed } from "vue";
import { GET_SERVER_CONFIG } from "@/graphQLData/admin/queries";
import { UPDATE_SERVER_CONFIG } from "@/graphQLData/admin/mutations";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import Notification from "@/components/NotificationComponent.vue";
import type { ServerConfigUpdateInput, GetServerConfigQuery } from "@/__generated__/graphql";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { config } from "@/config";
import CreateEditServerFields from "@/components/admin/CreateEditServerFields.vue";

const dataLoaded = ref(false);
const {
  result: getServerResult,
  error: getServerError,
  loading: getServerLoading,
  onResult: onGetServerResult,
} = useQuery(
  GET_SERVER_CONFIG,
  {
    serverName: config.serverName,
  },
  {
    fetchPolicy: "cache-first",
  }
);

const serverConfig = computed(() => {
  if (getServerError.value || !getServerResult.value?.serverConfigs) {
    return null;
  }
  return getServerResult.value.serverConfigs?.[0] || null;
});
const formValues = ref<ServerConfigUpdateInput>({
  serverDescription: "",
  rules: [],
  allowedFileTypes: [],
  enableDownloads: false,
});

onGetServerResult((result) => {
  dataLoaded.value = true;
  const serverConfig = result.data?.serverConfigs[0];
  let rules = [];
  try {
    rules = JSON.parse(serverConfig.rules) || [];
  } catch (e) {
    console.error("Error parsing server rules", e);
  }
  formValues.value = {
    serverDescription: serverConfig.serverDescription || "",
    rules,
    allowedFileTypes: serverConfig.allowedFileTypes || [],
    enableDownloads: serverConfig.enableDownloads || false,
  };
});

const serverUpdateInput = computed(() => {
  // For now, this is the same format as form values,
  // but if the form supports RBAC in the future, this
  // will be more complicated.
  return {
    serverDescription: formValues.value.serverDescription,
    rules: JSON.stringify(formValues.value.rules) || "[]",
    allowedFileTypes: formValues.value.allowedFileTypes || [],
    enableDownloads: formValues.value.enableDownloads || false,
  };
});

const showSavedChangesNotification = ref(false);

const {
  mutate: updateServer,
  loading: editServerLoading,
  error: updateServerError,
  onDone,
} = useMutation(UPDATE_SERVER_CONFIG, {
  update: (cache, { data }) => {
    const newServerConfig = data?.updateServerConfigs.serverConfigs[0];
    if (newServerConfig) {
      // Read the existing cache data first
      try {
        const existingData = cache.readQuery<GetServerConfigQuery>({
          query: GET_SERVER_CONFIG,
          variables: {
            serverName: config.serverName,
          },
        });
        
        if (existingData?.serverConfigs?.[0]) {
          // Merge the updated fields with the existing data
          const updatedServerConfig = {
            ...existingData.serverConfigs[0],
            ...newServerConfig,
          };
          
          cache.writeQuery({
            query: GET_SERVER_CONFIG,
            variables: {
              serverName: config.serverName,
            },
            data: {
              serverConfigs: [updatedServerConfig],
            },
          });
        }
      } catch (error) {
        console.error('Cache update error:', error);
        // Fallback to refetch if cache update fails
        try {
          cache.evict({ 
            id: cache.identify({ 
              __typename: 'ServerConfig', 
              serverName: config.serverName 
            }) 
          });
        } catch (evictError) {
          console.error('Cache eviction error:', evictError);
        }
      }
    }
  },
});

onDone(() => {
  showSavedChangesNotification.value = true;
});

function submit() {
  updateServer({
    input: serverUpdateInput.value,
    serverName: config.serverName,
  });
}

function updateFormValues(data: ServerConfigUpdateInput) {
  formValues.value = { ...formValues.value, ...data };
}
</script>

<template>
  <div class="px-8">
    <RequireAuth :loading="getServerLoading">
      <template #has-auth>
        <CreateEditServerFields
          :key="dataLoaded.toString()"
          :edit-mode="true"
          :server-loading="getServerLoading"
          :get-server-error="getServerError"
          :update-server-error="updateServerError"
          :edit-server-loading="editServerLoading"
          :form-values="formValues"
          @submit="submit"
          @update-form-values="updateFormValues"
        />
        <Notification
          v-if="showSavedChangesNotification"
          title="Your changes have been saved."
          @close-notification="showSavedChangesNotification = false"
        />
      </template>
      <template #does-not-have-auth>
        <div class="p-8 dark:text-white">
          You don't have permission to see this page.
        </div>
      </template>
    </RequireAuth>
  </div>
</template>
