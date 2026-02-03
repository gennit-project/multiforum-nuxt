<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { UserData } from '@/types/User';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import { UPDATE_CHANNEL } from '@/graphQLData/channel/mutations';
import type { CreateEditChannelFormValues } from '@/types/Channel';
import CreateEditChannelFields from '@/components/channel/form/CreateEditChannelFields.vue';
import Notification from '@/components/NotificationComponent.vue';
import { usernameVar } from '@/cache';
import type {
  ChannelUpdateInput,
  Tag as TagData,
} from '@/__generated__/graphql';
import { useRoute } from 'nuxt/app';
import { useQuery, useMutation } from '@vue/apollo-composable';

const route = useRoute();
const channelId = route.params.forumId as string;

const {
  result: getChannelResult,
  loading: getChannelLoading,
  error: getChannelError,
  refetch: refetchChannel,
} = useQuery(GET_CHANNEL, {
  uniqueName: channelId,
  errorPolicy: 'all',
});

const formValues = ref<CreateEditChannelFormValues>({
  uniqueName: '',
  displayName: '',
  description: '',
  selectedTags: [],
  rules: [],
  channelIconURL: '',
  channelBannerURL: '',
  wikiEnabled: false,
  eventsEnabled: true,
  feedbackEnabled: true,
  downloadsEnabled: false,
  allowedFileTypes: [],
  downloadFilterGroups: [],
});

const dataLoaded = ref(false);

const channel = computed(() => getChannelResult.value?.channels[0]);

watch(
  getChannelResult,
  (newVal) => {
    if (newVal && !getChannelLoading.value && !getChannelError.value) {
      const channelData = newVal.channels[0];
      let rules = [];

      try {
        rules = JSON.parse(channelData.rules) || [];
      } catch (e) {
        console.error('Error parsing channel rules', e);
      }

      formValues.value = {
        uniqueName: channelData.uniqueName,
        description: channelData.description,
        displayName: channelData.displayName,
        selectedTags: channelData.Tags.map((tag: TagData) => tag.text),
        channelIconURL: channelData.channelIconURL,
        channelBannerURL: channelData.channelBannerURL,
        wikiEnabled: channelData.wikiEnabled,
        eventsEnabled: channelData.eventsEnabled,
        feedbackEnabled: channelData.feedbackEnabled,
        downloadsEnabled: channelData.downloadsEnabled,
        allowedFileTypes: channelData.allowedFileTypes || [],
        downloadFilterGroups: channelData.FilterGroups || [],
        rules,
      };

      dataLoaded.value = true;
    }
  },
  { immediate: true }
);

const existingTags = computed(() => {
  return channel.value?.Tags?.map((tag: TagData) => tag.text) || [];
});

const ownerList = computed(() => {
  return channel.value?.Admins?.map((admin: UserData) => admin.username) || [];
});

const isOwner = computed(() => {
  if (!usernameVar.value) return false;
  return ownerList.value.includes(usernameVar.value);
});

const existingFilterGroups = computed(() => {
  return channel.value?.FilterGroups || [];
});

const channelUpdateInput = computed<ChannelUpdateInput>(() => {
  const tagConnections = formValues.value.selectedTags.map((tag: string) => ({
    onCreate: { node: { text: tag } },
    where: { node: { text: tag } },
  }));

  const tagDisconnections = existingTags.value
    .filter((tag: string) => !formValues.value.selectedTags.includes(tag))
    .map((tag: TagData) => ({
      where: { node: { text: tag } },
    }));

  // Handle FilterGroups using connect/create/disconnect pattern (like Tags)
  const existingFilterGroupIds = existingFilterGroups.value.map(
    (group: any) => group.id
  );
  const currentFilterGroupIds = formValues.value.downloadFilterGroups
    .map((group: any) => group.id)
    .filter(Boolean); // Only existing groups have IDs

  // Connect to existing groups that are still selected
  const filterGroupConnections = formValues.value.downloadFilterGroups
    .filter((group: any) => group.id) // Only existing groups
    .map((group, _index) => ({
      where: { node: { id: group.id } },
      // Note: We might need to handle updates here if group properties changed
    }));

  // Create new groups (those without IDs)
  const filterGroupCreations = formValues.value.downloadFilterGroups
    .filter((group: any) => !group.id) // Only new groups
    .map((group, _index) => ({
      node: {
        id: '', // Empty ID for new groups - server will generate
        key: group.key,
        displayName: group.displayName,
        mode: group.mode,
        order: formValues.value.downloadFilterGroups.indexOf(group),
        options: group.options
          ? {
              create: group.options.map((option, optionIndex) => ({
                node: {
                  id: '', // Empty ID for new options - server will generate
                  value: option.value,
                  displayName: option.displayName,
                  order: optionIndex,
                },
              })),
            }
          : undefined,
      },
    }));

  // Disconnect groups that were removed
  const filterGroupDisconnections = existingFilterGroupIds
    .filter((id: string) => !currentFilterGroupIds.includes(id))
    .map((id: string) => ({
      where: { node: { id } },
    }));

  return {
    description: formValues.value.description,
    displayName: formValues.value.displayName,
    channelIconURL: formValues.value.channelIconURL,
    channelBannerURL: formValues.value.channelBannerURL,
    rules: JSON.stringify(formValues.value.rules),
    wikiEnabled: formValues.value.wikiEnabled,
    eventsEnabled: formValues.value.eventsEnabled,
    feedbackEnabled: formValues.value.feedbackEnabled,
    downloadsEnabled: formValues.value.downloadsEnabled,
    allowedFileTypes: formValues.value.allowedFileTypes,
    Tags: [{ connectOrCreate: tagConnections, disconnect: tagDisconnections }],
    FilterGroups: [
      ...(filterGroupConnections.length > 0
        ? [{ connect: filterGroupConnections }]
        : []),
      ...(filterGroupCreations.length > 0
        ? [{ create: filterGroupCreations }]
        : []),
      ...(filterGroupDisconnections.length > 0
        ? [{ disconnect: filterGroupDisconnections }]
        : []),
    ],
    Admins: [
      { connect: [{ where: { node: { username: usernameVar.value } } }] },
    ],
  };
});

const showSavedChangesNotification = ref(false);
const {
  mutate: updateChannel,
  loading: editChannelLoading,
  error: updateChannelError,
  onDone,
  onError,
} = useMutation(UPDATE_CHANNEL);

onDone(() => {
  showSavedChangesNotification.value = true;
  // Refetch channel data to ensure form values are in sync with server
  refetchChannel();
});

onError((error) => {
  console.error('Channel update mutation error:', error);
});

function submit() {
  try {
    const updateInput = channelUpdateInput.value;
    updateChannel({
      where: { uniqueName: channelId },
      update: updateInput,
    });
  } catch (error) {
    console.error('Error building channel update input:', error);
  }
}

function updateFormValues(data: CreateEditChannelFormValues) {
  formValues.value = { ...formValues.value, ...data };
}

const hasError = computed(() => {
  return !!getChannelError.value || !!updateChannelError.value;
});
</script>

<template>
  <div :key="$route.fullPath" class="px-2 md:px-8">
    <div
      v-if="hasError"
      class="mb-4 rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-800 dark:text-red-200"
    >
      <p>
        Sorry, there was an error loading the forum data. Please try again
        later.
      </p>
      <p class="mt-2 text-sm">
        {{ getChannelError?.message || updateChannelError?.message }}
      </p>
    </div>

    <ClientOnly>
      <CreateEditChannelFields
        v-if="!hasError"
        :key="dataLoaded.toString()"
        :edit-mode="true"
        :channel-loading="getChannelLoading"
        :get-channel-error="getChannelError"
        :update-channel-error="updateChannelError"
        :edit-channel-loading="editChannelLoading"
        :form-values="formValues"
        :owner-list="ownerList"
        :has-permission="isOwner"
        :data-loaded="dataLoaded"
        @submit="submit"
        @update-form-values="updateFormValues"
      />
      <template #fallback>
        <div class="p-8 text-center">
          <div class="animate-pulse">
            <div
              class="mb-4 h-8 w-1/4 rounded bg-gray-200 dark:bg-gray-700"
            />
            <div
              class="mb-8 h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700"
            />
            <div class="space-y-4">
              <div class="h-10 rounded bg-gray-200 dark:bg-gray-700" />
              <div class="h-10 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </template>
    </ClientOnly>
    <Notification
      v-if="showSavedChangesNotification"
      title="Your changes have been saved."
      @close-notification="showSavedChangesNotification = false"
    />
  </div>
</template>
