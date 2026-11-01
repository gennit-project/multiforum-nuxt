<script setup lang="ts">
import { CreateDiscussionDocument as CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS,
  UpdateDownloadLabelsDocument as UPDATE_DOWNLOAD_LABELS,
  UpdateDownloadableFileSupportSettingsDocument as UPDATE_DOWNLOADABLE_FILE_SUPPORT_SETTINGS, GetChannelDocument as GET_CHANNEL  } from '@/__generated__/operations';
import { buildAlbumUpdateInput } from '@/utils/albumUpdateInput';
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import { useMutation, useQuery } from '@vue/apollo-composable';
import CreateEditDiscussionFields from '@/components/discussion/form/CreateEditDiscussionFields.vue';
import type { CreateEditDiscussionFormValues } from '@/types/Discussion';
import ErrorBanner from '@/components/ErrorBanner.vue';

const router = useRouter();
const route = useRoute();

const channelId = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

// Get channel data including allowedFileTypes
const { result: channelResult, loading: channelLoading } = useQuery(
  GET_CHANNEL,
  () => ({
    uniqueName: channelId.value,
    now: new Date().toISOString(),
  })
);

const channelData = computed(() => {
  return channelResult.value?.channels?.[0] || null;
});

const formValues = ref<CreateEditDiscussionFormValues>({
  title: '',
  body: '',
  selectedChannels: channelId.value ? [channelId.value] : [],
  selectedTags: [],
  author: '',
  album: {
    images: [],
    imageOrder: [],
  },
  crosspostId: null,
});
const submitError = ref('');

const createDownloadVariables = () => {
  const tagConnections = formValues.value.selectedTags.map((tag: string) => ({
    where: { node: { text: { eq: tag } } },
  }));

  // Build downloadable files connections
  const downloadableFileConnections = (formValues.value.downloadableFiles || [])
    .filter((file) => file.id) // Only connect files that have database IDs
    .map((file) => ({
      where: { node: { id: { eq: file.id } } },
    }));

  const album = buildAlbumUpdateInput({ albumData: formValues.value.album });

  const discussionCreateInput = {
    title: formValues.value.title,
    body: formValues.value.body,
    hasDownload: true,
    Tags: { connect: tagConnections },
    ...(downloadableFileConnections.length > 0 && {
      DownloadableFiles: {
        connect: downloadableFileConnections,
      },
    }),
    ...(album && { Album: { create: { node: {
      imageOrder: album.imageIds,
      Images: { connect: album.imageIds.map(id => ({ where: { node: { id: { eq: id } } } })) },
    } } } }),
  };

  return {
    input: [
      {
        discussionCreateInput,
        channelConnections: formValues.value.selectedChannels,
        ...(formValues.value.crosspostId ? { crosspostedDiscussionId: formValues.value.crosspostId } : {}),
      },
    ],
  };
};

const {
  mutate: createDownload,
  loading: createDownloadLoading,
  error: createDownloadError,
} = useMutation(CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS);

const {
  mutate: updateDiscussionChannelLabels,
  loading: _updateLabelsLoading,
  error: _updateLabelsError,
} = useMutation(UPDATE_DOWNLOAD_LABELS);

const { mutate: updateDownloadableFileSupportSettings } = useMutation(
  UPDATE_DOWNLOADABLE_FILE_SUPPORT_SETTINGS
);

const getLabelOptionIds = () => Object.entries(formValues.value.downloadLabels ?? {}).flatMap(([key, values]) => {
  const group = channelData.value?.FilterGroups?.find((item) => item.key === key);
  return values.flatMap((value) => {
    const option = group?.options?.find((item) => item.value === value);
    return option?.id ? [option.id] : [];
  });
});
let routeGeneration = 0;
onBeforeUnmount(() => { routeGeneration++; });
const submitting = ref(false);

const updateFormValues = (
  newValues: Partial<CreateEditDiscussionFormValues>
) => {
  formValues.value = { ...formValues.value, ...newValues };
};

const submitForm = async () => {
  if (submitting.value || !channelId.value) return;
  if (channelData.value?.downloadsEnabled === false) {
    submitError.value = 'Downloads are disabled in this channel.';
    return;
  }
  const scope = routeGeneration;
  const channel = channelId.value;
  const labelOptionIds = getLabelOptionIds();
  const files = (formValues.value.downloadableFiles ?? []).flatMap((file) => file.id ? [{
    downloadableFileId: file.id,
    input: {
      attributionOverride: file.attributionOverride || null,
      supportPatreonUrl: file.supportPatreonUrl || null,
      supportBuyMeACoffeeUrl: file.supportBuyMeACoffeeUrl || null,
      supportKoFiUrl: file.supportKoFiUrl || null,
      supportPayPalMeUrl: file.supportPayPalMeUrl || null,
    },
  }] : []);
  const current = () => scope === routeGeneration && channel === channelId.value;
  submitting.value = true;
  submitError.value = '';
  try {
    const response = await createDownload(createDownloadVariables());
    if (!current()) return;
    const discussionId = response?.data?.createDiscussionWithChannelConnections?.[0]?.id;
    if (!discussionId) throw new Error('No discussionId found in response');
    if (labelOptionIds.length) {
      try {
        await updateDiscussionChannelLabels({ discussionId, channelUniqueName: channel, labelOptionIds });
      } catch (error) {
        console.error('Error saving download labels:', error);
      }
    }
    if (!current()) return;
    await Promise.all(files.map((file) => updateDownloadableFileSupportSettings({ ...file, discussionId })));
    if (current()) router.push({ name: 'forums-forumId-downloads-discussionId', params: { forumId: channel, discussionId } });
  } catch (error) {
    console.error('Error creating download:', error);
    if (current()) submitError.value = error instanceof Error ? error.message : 'Error creating download';
  } finally {
    if (current()) submitting.value = false;
  }
};

watch(channelId, (newForumId) => {
  routeGeneration++;
  submitting.value = false;
  submitError.value = '';
  formValues.value.selectedChannels = newForumId ? [newForumId] : [];
});

</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-6">
    <div v-if="channelLoading">Loading channel data...</div>
    <template v-else>
      <ErrorBanner v-if="submitError" :text="submitError" class="mb-4" />
      <CreateEditDiscussionFields
        :edit-mode="false"
        :form-values="formValues"
        :create-discussion-error="createDownloadError"
        :create-discussion-loading="createDownloadLoading || submitting"
        :download-mode="true"
        :channel-data="channelData"
        :locked-channel-name="channelId || undefined"
        :locked-channel-label="
          channelData?.displayName || channelId || undefined
        "
        @submit="submitForm"
        @update-form-values="updateFormValues"
      />
    </template>
  </div>
</template>
