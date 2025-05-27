<script setup lang="ts">
import { ref, computed } from "vue";
import { GET_SERVER_CONFIG } from "@/graphQLData/admin/queries";
import { UPDATE_SERVER_CONFIG } from "@/graphQLData/admin/mutations";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import Notification from "@/components/NotificationComponent.vue";
import type { ServerConfigUpdateInput } from "@/__generated__/graphql";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { config } from "@/config";
import CreateEditServerFields from "@/components/admin/CreateEditServerFields.vue";

<<<<<<< HEAD
  const dataLoaded = ref(false);
  const {
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

  const formValues = ref<ServerConfigUpdateInput>({
    serverDescription: "",
    rules: [],
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
    };
  });

  const serverUpdateInput = computed(() => {
    // For now, this is the same format as form values,
    // but if the form supports RBAC in the future, this
    // will be more complicated.
    return {
      serverDescription: formValues.value.serverDescription,
      rules: JSON.stringify(formValues.value.rules) || "[]",
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
        cache.writeQuery({
          query: GET_SERVER_CONFIG,
          variables: {
            serverName: config.serverName,
          },
          data: {
            serverConfigs: [newServerConfig],
          },
        });
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
=======
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
>>>>>>> parent of 666ae3d (Use automated formatting tools)
  }
);

const serverConfig = computed(() => {
  if (getServerError.value || !getServerResult.value?.serverConfigs) {
    return null;
  }
  return getServerResult.value?.serverConfigs[0] || null;
});
const formValues = ref<ServerConfigUpdateInput>({
  serverDescription: "",
  rules: [],
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
  };
});

const serverUpdateInput = computed(() => {
  // For now, this is the same format as form values,
  // but if the form supports RBAC in the future, this
  // will be more complicated.
  return {
    serverDescription: formValues.value.serverDescription,
    rules: JSON.stringify(formValues.value.rules) || "[]",
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
      cache.writeQuery({
        query: GET_SERVER_CONFIG,
        variables: {
          serverName: config.serverName,
        },
        data: {
          serverConfigs: [newServerConfig],
        },
      });
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
