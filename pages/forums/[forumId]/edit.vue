<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { UserData } from '@/types/User';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import { UPDATE_CHANNEL } from '@/graphQLData/channel/mutations';
import type { CreateEditChannelFormValues } from '@/types/Channel';
import CreateEditChannelFields from '@/components/channel/form/CreateEditChannelFields.vue';
import Notification from '@/components/NotificationComponent.vue';
import { useUsername } from '@/composables/useAuthState';
import type {
  ChannelUpdateInput,
  FilterGroup,
  FilterOption,
  Tag as TagData,
} from '@/__generated__/graphql';
import { useRoute } from 'nuxt/app';
import { useQuery, useMutation } from '@vue/apollo-composable';
import {
  useSettingAutosave,
  type AutosaveStatus,
} from '@/composables/useSettingAutosave';

const usernameVar = useUsername();

const route = useRoute();
const channelId = route.params.forumId as string;

// Autosave for the simple toggle tabs (Events, Images, Emoji, Feedback). Uses a
// separate UPDATE_CHANNEL instance so a toggle save doesn't trigger the
// form-wide "changes saved" toast/refetch — the SaveStatus indicator covers it.
// Each toggle sends a SCOPED partial update (only its own field). Declared
// before the channel query's immediate watch so the watch can prime baselines.
const { mutate: updateChannelField } = useMutation(UPDATE_CHANNEL);
const saveChannelField = (update: ChannelUpdateInput) =>
  updateChannelField({ where: { uniqueName: channelId }, update });

const eventsAutosave = useSettingAutosave<boolean>({
  save: (eventsEnabled) => saveChannelField({ eventsEnabled }),
});
const imageUploadsAutosave = useSettingAutosave<boolean>({
  save: (imageUploadsEnabled) => saveChannelField({ imageUploadsEnabled }),
});
const markdownImagesAutosave = useSettingAutosave<boolean>({
  save: (markdownImagesEnabled) => saveChannelField({ markdownImagesEnabled }),
});
const feedbackAutosave = useSettingAutosave<boolean>({
  save: (feedbackEnabled) => saveChannelField({ feedbackEnabled }),
});
const emojiAutosave = useSettingAutosave<boolean>({
  save: (emojiEnabled) => saveChannelField({ emojiEnabled }),
});

const channelAutosaves = [
  eventsAutosave,
  imageUploadsAutosave,
  markdownImagesAutosave,
  feedbackAutosave,
  emojiAutosave,
];

const autosaveStatus = computed<AutosaveStatus>(() => {
  const statuses = channelAutosaves.map((a) => a.status.value);
  if (statuses.includes('saving')) return 'saving';
  if (statuses.includes('error')) return 'error';
  if (statuses.includes('saved')) return 'saved';
  return 'idle';
});
const autosaveErrorMessage = computed(
  () =>
    channelAutosaves.find((a) => a.error.value)?.error.value?.message || ''
);

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
  imageUploadsEnabled: true,
  markdownImagesEnabled: true,
  emojiEnabled: true,
  downloadsEnabled: false,
  allowedFileTypes: [],
  downloadFilterGroups: [],
});

const dataLoaded = ref(false);

const channel = computed(() => getChannelResult.value?.channels?.[0]);

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
        imageUploadsEnabled: channelData.imageUploadsEnabled !== false,
        markdownImagesEnabled: channelData.markdownImagesEnabled !== false,
        emojiEnabled: channelData.emojiEnabled !== false,
        downloadsEnabled: channelData.downloadsEnabled,
        allowedFileTypes: channelData.allowedFileTypes || [],
        downloadFilterGroups: channelData.FilterGroups || [],
        rules,
      };

      // Prime autosave baselines so the first edit matching the loaded value
      // does not fire a redundant save.
      eventsAutosave.setInitial(Boolean(channelData.eventsEnabled));
      imageUploadsAutosave.setInitial(channelData.imageUploadsEnabled !== false);
      markdownImagesAutosave.setInitial(
        channelData.markdownImagesEnabled !== false
      );
      feedbackAutosave.setInitial(Boolean(channelData.feedbackEnabled));
      emojiAutosave.setInitial(channelData.emojiEnabled !== false);

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

const isPersistedId = (id: unknown): id is string =>
  typeof id === 'string' && id.length > 0 && !id.startsWith('local-');

const toFilterOptionCreate = (option: FilterOption, optionIndex: number) => ({
  node: {
    id: '',
    value: option.value,
    displayName: option.displayName,
    order: optionIndex,
  },
});

const toFilterOptionUpdate = (option: FilterOption, optionIndex: number) => ({
  where: { node: { id: option.id } },
  update: {
    node: {
      value: option.value,
      displayName: option.displayName,
      order: optionIndex,
    },
  },
});

const buildFilterOptionUpdates = (
  currentGroup: FilterGroup,
  existingGroup?: FilterGroup
) => {
  const currentOptions = currentGroup.options || [];
  const existingOptions = existingGroup?.options || [];
  const currentExistingOptionIds = currentOptions
    .map((option: FilterOption) => option.id)
    .filter(isPersistedId);
  const createdOptions = currentOptions
    .flatMap((option: FilterOption, optionIndex: number) =>
      !isPersistedId(option.id)
        ? [toFilterOptionCreate(option, optionIndex)]
        : []
    );
  const updatedOptions = currentOptions
    .flatMap((option: FilterOption, optionIndex: number) =>
      isPersistedId(option.id)
        ? [toFilterOptionUpdate(option, optionIndex)]
        : []
    );
  const deletedOptions = existingOptions
    .filter((option: FilterOption) =>
      !currentExistingOptionIds.includes(option.id)
    )
    .map((option: FilterOption) => ({
      where: { node: { id: option.id } },
    }));

  return [
    ...(updatedOptions.length > 0 ? updatedOptions : []),
    ...(createdOptions.length > 0 ? [{ create: createdOptions }] : []),
    ...(deletedOptions.length > 0 ? [{ delete: deletedOptions }] : []),
  ];
};

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

  // Keep filter groups atomic inside the channel update: create new groups,
  // update existing groups/options, and delete removed groups/options.
  const existingFilterGroupIds = existingFilterGroups.value.map(
    (group: FilterGroup) => group.id
  );
  const currentFilterGroupIds = formValues.value.downloadFilterGroups
    .map((group: FilterGroup) => group.id)
    .filter(isPersistedId);

  const filterGroupUpdates = formValues.value.downloadFilterGroups
    .filter((group: FilterGroup) => isPersistedId(group.id))
    .map((group, index) => {
      const existingGroup = existingFilterGroups.value.find(
        (existingGroup: FilterGroup) => existingGroup.id === group.id
      );
      const optionUpdates = buildFilterOptionUpdates(group, existingGroup);
      return {
        where: { node: { id: group.id } },
        update: {
          node: {
            key: group.key,
            displayName: group.displayName,
            mode: group.mode,
            order: index,
            ...(optionUpdates.length > 0 ? { options: optionUpdates } : {}),
          },
        },
      };
    });

  // Create new groups (those without IDs)
  const filterGroupCreations = formValues.value.downloadFilterGroups
    .filter((group: FilterGroup) => !isPersistedId(group.id))
    .map((group, _index) => ({
      node: {
        id: '', // Empty ID for new groups - server will generate
        key: group.key,
        displayName: group.displayName,
        mode: group.mode,
        order: formValues.value.downloadFilterGroups.indexOf(group),
        options: group.options
          ? {
              create: group.options.map(toFilterOptionCreate),
            }
          : undefined,
      },
    }));

  // Delete groups that were removed from the settings form.
  const filterGroupDeletions = existingFilterGroupIds
    .filter((id: string) => !currentFilterGroupIds.includes(id))
    .map((id: string) => ({
      where: { node: { id } },
      delete: { options: [{}] },
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
    imageUploadsEnabled: formValues.value.imageUploadsEnabled,
    markdownImagesEnabled: formValues.value.markdownImagesEnabled,
    emojiEnabled: formValues.value.emojiEnabled,
    downloadsEnabled: formValues.value.downloadsEnabled,
    allowedFileTypes: formValues.value.allowedFileTypes,
    Tags: [{ connectOrCreate: tagConnections, disconnect: tagDisconnections }],
    FilterGroups: [
      ...(filterGroupUpdates.length > 0
        ? filterGroupUpdates
        : []),
      ...(filterGroupCreations.length > 0
        ? [{ create: filterGroupCreations }]
        : []),
      ...(filterGroupDeletions.length > 0
        ? [{ delete: filterGroupDeletions }]
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

  // The Events, Images, Emoji, and Feedback tabs autosave their toggles on
  // change. Other tabs continue to batch through submit().
  if ('eventsEnabled' in data) {
    eventsAutosave.trigger(Boolean(data.eventsEnabled));
  }
  if ('imageUploadsEnabled' in data) {
    imageUploadsAutosave.trigger(Boolean(data.imageUploadsEnabled));
  }
  if ('markdownImagesEnabled' in data) {
    markdownImagesAutosave.trigger(Boolean(data.markdownImagesEnabled));
  }
  if ('feedbackEnabled' in data) {
    feedbackAutosave.trigger(Boolean(data.feedbackEnabled));
  }
  if ('emojiEnabled' in data) {
    emojiAutosave.trigger(Boolean(data.emojiEnabled));
  }
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
        :save-status="autosaveStatus"
        :save-error-message="autosaveErrorMessage"
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
