<script setup lang="ts">
import { ref, computed } from 'vue';
import { GetServerConfigDocument as GET_SERVER_CONFIG, SetFeaturedWikiPagesDocument as SET_FEATURED_WIKI_PAGES, UpdateServerConfigDocument as UPDATE_SERVER_CONFIG  } from '@/__generated__/operations';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import Notification from '@/components/NotificationComponent.vue';
import type {
  ServerConfigUpdateInput,
} from '@/__generated__/graphql';
import { isPluginRecord } from '@/utils/pluginManifestUtils';
import type { BrandingLink } from '@/utils/branding';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { config } from '@/config';
import CreateEditServerFields from '@/components/admin/CreateEditServerFields.vue';
import {
  useSettingAutosave,
  type AutosaveStatus,
} from '@/composables/useSettingAutosave';

// The form model holds plain scalar values (mirroring the ServerConfig entity),
// not GraphQL update inputs. The v7 ServerConfigUpdateInput wraps every scalar
// in `{ set: ... }`; that wrapping happens only at the mutation boundary
// (serverUpdateInput / saveServerField), so the form itself stays plain.
import type { ServerSettingsFormValues } from '@/types/ServerSettings';

// The API returns the JSON column as either a parsed array or a string,
// depending on the driver; normalize before the form binds to it.
const parseCustomFooterLinks = (value: unknown): BrandingLink[] => {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value); } catch { return []; }
  }
  return Array.isArray(parsed) ? parsed.flatMap((item: unknown) =>
    isPluginRecord(item) && typeof item.label === 'string' && typeof item.url === 'string'
      ? [{ label: item.label, url: item.url }] : []) : [];
};

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
    fetchPolicy: 'cache-first',
  }
);

const serverConfig = computed(() => {
  if (getServerError.value || !getServerResult.value?.serverConfigs) {
    return null;
  }
  return getServerResult.value.serverConfigs?.[0] || null;
});
const formValues = ref<ServerSettingsFormValues>({
  serverDescription: '',
  rules: [],
  allowedFileTypes: [],
  enableDownloads: false,
  enableEvents: false,
  accountAgeGateEnabled: false,
  minimumAccountAge: 13,
  sensitiveContentAgeGateEnabled: false,
  minimumSensitiveContentAge: 18,
  pluginRegistries: [],
  featuredWikiPageIds: [],
  serverIconURL: '',
  brandingLogoDarkURL: '',
  brandingLogoAlt: '',
  brandingFaviconURL: '',
  brandingPrimaryColor: '',
  brandingProductName: '',
  brandingDocsURL: '',
  brandingSourceURL: '',
  brandingIssuesURL: '',
  brandingSupportEmail: '',
  brandingShowUpstreamLinks: true,
  brandingCustomFooterLinks: [],
});

onGetServerResult((result) => {
  dataLoaded.value = true;
  const serverConfig = result.data?.serverConfigs?.[0];
  if (!serverConfig) return;

  let rules = [];
  try {
    rules = typeof serverConfig.rules === 'string' ? JSON.parse(serverConfig.rules) : serverConfig.rules || [];
  } catch (e) {
    console.error('Error parsing server rules', e);
  }

  formValues.value = {
    serverDescription: serverConfig.serverDescription || '',
    rules,
    allowedFileTypes: serverConfig.allowedFileTypes || [],
    enableDownloads: Boolean(serverConfig.enableDownloads),
    enableEvents: Boolean(serverConfig.enableEvents),
    accountAgeGateEnabled: Boolean(serverConfig.accountAgeGateEnabled),
    minimumAccountAge: serverConfig.minimumAccountAge ?? 13,
    sensitiveContentAgeGateEnabled: Boolean(
      serverConfig.sensitiveContentAgeGateEnabled
    ),
    minimumSensitiveContentAge: serverConfig.minimumSensitiveContentAge ?? 18,
    pluginRegistries: serverConfig.pluginRegistries || [],
    featuredWikiPageIds: serverConfig.featuredWikiPageIds || [],
    serverIconURL: serverConfig.serverIconURL || '',
    brandingLogoDarkURL: serverConfig.brandingLogoDarkURL || '',
    brandingLogoAlt: serverConfig.brandingLogoAlt || '',
    brandingFaviconURL: serverConfig.brandingFaviconURL || '',
    brandingPrimaryColor: serverConfig.brandingPrimaryColor || '',
    brandingProductName: serverConfig.brandingProductName || '',
    brandingDocsURL: serverConfig.brandingDocsURL || '',
    brandingSourceURL: serverConfig.brandingSourceURL || '',
    brandingIssuesURL: serverConfig.brandingIssuesURL || '',
    brandingSupportEmail: serverConfig.brandingSupportEmail || '',
    // The column is null until an admin saves the tab; the footer's default is
    // to show upstream links, so null must read as true rather than false.
    brandingShowUpstreamLinks: serverConfig.brandingShowUpstreamLinks !== false,
    brandingCustomFooterLinks: parseCustomFooterLinks(
      serverConfig.brandingCustomFooterLinks
    ),
  };

  // Prime the autosave baselines so the first edit that happens to match the
  // loaded value does not fire a redundant save.
  descriptionAutosave.setInitial(serverConfig.serverDescription || '');
  enableEventsAutosave.setInitial(Boolean(serverConfig.enableEvents));
});

const serverUpdateInput = computed<ServerConfigUpdateInput>(() => {
  // For now, this is the same format as form values,
  // but if the form supports RBAC in the future, this
  // will be more complicated. v7 requires each scalar wrapped in `{ set: ... }`.
  return {
    serverDescription: { set: formValues.value.serverDescription },
    rules: { set: JSON.stringify(formValues.value.rules) || '[]' },
    allowedFileTypes: { set: formValues.value.allowedFileTypes || [] },
    enableDownloads: { set: formValues.value.enableDownloads || false },
    enableEvents: { set: formValues.value.enableEvents || false },
    accountAgeGateEnabled: {
      set: formValues.value.accountAgeGateEnabled || false,
    },
    minimumAccountAge: { set: formValues.value.minimumAccountAge ?? 13 },
    sensitiveContentAgeGateEnabled: {
      set: formValues.value.sensitiveContentAgeGateEnabled || false,
    },
    minimumSensitiveContentAge: {
      set: formValues.value.minimumSensitiveContentAge ?? 18,
    },
    pluginRegistries: { set: formValues.value.pluginRegistries || [] },
    serverIconURL: { set: formValues.value.serverIconURL || '' },
    brandingLogoDarkURL: { set: formValues.value.brandingLogoDarkURL || '' },
    brandingLogoAlt: { set: formValues.value.brandingLogoAlt || '' },
    brandingFaviconURL: { set: formValues.value.brandingFaviconURL || '' },
    brandingPrimaryColor: { set: formValues.value.brandingPrimaryColor || '' },
    brandingProductName: { set: formValues.value.brandingProductName || '' },
    brandingDocsURL: { set: formValues.value.brandingDocsURL || '' },
    brandingSourceURL: { set: formValues.value.brandingSourceURL || '' },
    brandingIssuesURL: { set: formValues.value.brandingIssuesURL || '' },
    brandingSupportEmail: { set: formValues.value.brandingSupportEmail || '' },
    brandingShowUpstreamLinks: {
      set: formValues.value.brandingShowUpstreamLinks !== false,
    },
    // Stored as a JSON column, the same way rules are.
    brandingCustomFooterLinks: {
      set: JSON.stringify(formValues.value.brandingCustomFooterLinks || []),
    },
  };
});

const showSavedChangesNotification = ref(false);

const {
  mutate: updateServer,
  loading: editServerLoading,
  error: updateServerError,
} = useMutation(UPDATE_SERVER_CONFIG, {
  update: (cache, { data }) => {
    const newServerConfig = data?.updateServerConfigs.serverConfigs[0];

    if (newServerConfig) {
      try {
        // Parse rules if they come back as string
        const updatedConfig = { ...newServerConfig };
        if (typeof updatedConfig.rules === 'string') {
          try {
            updatedConfig.rules = JSON.parse(updatedConfig.rules);
          } catch (e) {
            console.error('Error parsing rules from mutation response', e);
            updatedConfig.rules = [];
          }
        }

        // Update the form values with the new data
        formValues.value = {
          ...formValues.value,
          ...updatedConfig,
          enableDownloads: Boolean(newServerConfig.enableDownloads),
          enableEvents: Boolean(newServerConfig.enableEvents),
        };

        // Also update the cache - reconstruct the full config
        if (serverConfig.value) cache.writeQuery({
          query: GET_SERVER_CONFIG,
          variables: {
            serverName: config.serverName,
          },
          data: {
            serverConfigs: [
              {
                ...serverConfig.value,
                ...newServerConfig,
              },
            ],
          },
        });
      } catch (error) {
        console.error('Cache update error:', error);
        // Force refetch on error
        cache.evict({
          fieldName: 'serverConfigs',
        });
      }
    }
  },
});

const {
  mutate: setFeaturedWikiPages,
  loading: setFeaturedWikiPagesLoading,
  error: setFeaturedWikiPagesError,
} = useMutation(SET_FEATURED_WIKI_PAGES);

// Autosave for the scalar fields on the Basic and Calendar tabs. Each field
// gets its own debounced instance so an in-flight edit to one can't coalesce
// with — and drop — a change to the other. Each saves a SCOPED update input,
// which UPDATE_SERVER_CONFIG applies as a partial update.
const saveServerField = (input: ServerConfigUpdateInput) =>
  updateServer({ input, serverName: config.serverName });

const descriptionAutosave = useSettingAutosave<string>({
  save: (serverDescription) =>
    saveServerField({ serverDescription: { set: serverDescription } }),
});
const enableEventsAutosave = useSettingAutosave<boolean>({
  save: (enableEvents) => saveServerField({ enableEvents: { set: enableEvents } }),
});

const autosaveStatus = computed<AutosaveStatus>(() => {
  const statuses = [
    descriptionAutosave.status.value,
    enableEventsAutosave.status.value,
  ];
  if (statuses.includes('saving')) return 'saving';
  if (statuses.includes('error')) return 'error';
  if (statuses.includes('saved')) return 'saved';
  return 'idle';
});
const autosaveErrorMessage = computed(
  () =>
    descriptionAutosave.error.value?.message ||
    enableEventsAutosave.error.value?.message ||
    ''
);

const isSaving = computed(
  () => editServerLoading.value || setFeaturedWikiPagesLoading.value
);
const combinedUpdateError = computed(
  () => updateServerError.value || setFeaturedWikiPagesError.value
);

async function submit() {
  const hasConfiguredLogo = Boolean(
    formValues.value.serverIconURL?.trim() ||
    formValues.value.brandingLogoDarkURL?.trim()
  );
  if (hasConfiguredLogo && !formValues.value.brandingLogoAlt?.trim()) return;

  await updateServer({
    input: serverUpdateInput.value,
    serverName: config.serverName,
  });
  await setFeaturedWikiPages({
    serverName: config.serverName,
    wikiPageIds: formValues.value.featuredWikiPageIds || [],
  });
  showSavedChangesNotification.value = true;
}

function updateFormValues(data: ServerSettingsFormValues) {
  formValues.value = { ...formValues.value, ...data };

  // The Basic and Calendar tabs autosave their scalar fields on change instead
  // of waiting for a form-wide Save. Other tabs continue to batch via submit().
  if ('serverDescription' in data) {
    descriptionAutosave.trigger(data.serverDescription ?? '');
  }
  if ('enableEvents' in data) {
    enableEventsAutosave.trigger(Boolean(data.enableEvents));
  }
}
</script>

<template>
  <ClientOnly>
    <div class="px-8">
      <RequireAuth :loading="getServerLoading">
        <template #has-auth>
          <CreateEditServerFields
            :key="`${dataLoaded.toString()}-${formValues.enableDownloads}`"
            :edit-mode="true"
            :server-loading="getServerLoading"
            :get-server-error="getServerError"
            :update-server-error="combinedUpdateError"
            :edit-server-loading="isSaving"
            :form-values="formValues"
            :save-status="autosaveStatus"
            :save-error-message="autosaveErrorMessage"
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
  </ClientOnly>
</template>
