<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import { useMutation, useQuery } from '@vue/apollo-composable';
import CreateEditDiscussionFields from '@/components/discussion/form/CreateEditDiscussionFields.vue';
import {
  CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS,
  UPDATE_DOWNLOAD_LABELS,
  UPDATE_DISCUSSION,
  UPDATE_DOWNLOADABLE_FILE_SUPPORT_SETTINGS,
} from '@/graphQLData/discussion/mutations';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import type { CreateEditDiscussionFormValues } from '@/types/Discussion';
import type { FilterGroup, FilterOption } from '@/__generated__/graphql';
import { useUsername } from '@/composables/useAuthState';
import ErrorBanner from '@/components/ErrorBanner.vue';

const usernameVar = useUsername();

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

const {
  mutate: createDownload,
  loading: createDownloadLoading,
  error: createDownloadError,
  onDone,
} = useMutation(CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS);

const {
  mutate: updateDiscussionChannelLabels,
  loading: _updateLabelsLoading,
  error: _updateLabelsError,
} = useMutation(UPDATE_DOWNLOAD_LABELS);

const {
  mutate: updateDiscussion,
  loading: _updateDiscussionLoading,
  error: _updateDiscussionError,
} = useMutation(UPDATE_DISCUSSION);

const { mutate: updateDownloadableFileSupportSettings } = useMutation(
  UPDATE_DOWNLOADABLE_FILE_SUPPORT_SETTINGS
);

onDone(async (response) => {
  // Try both possible response structures
  const directId = response.data?.createDiscussionWithChannelConnections?.id;
  const arrayId =
    response.data?.createDiscussionWithChannelConnections?.[0]
      ?.DiscussionChannels?.[0]?.Discussion?.id;

  const newDiscussionId = directId || arrayId;

  if (newDiscussionId) {
    // Handle album if there are images
    if (formValues.value.album?.images?.length > 0) {
      await saveDownloadAlbum(newDiscussionId);
    }

    // Handle labels if they exist
    if (
      formValues.value.downloadLabels &&
      Object.keys(formValues.value.downloadLabels).length > 0
    ) {
      await saveDownloadLabels(newDiscussionId);
    }

    await saveDownloadSupportSettings(newDiscussionId);

    router.push({
      name: 'forums-forumId-downloads-discussionId',
      params: {
        forumId: channelId.value,
        discussionId: newDiscussionId,
      },
    });
  } else {
    console.error('No discussionId found in response');
  }
});

// Helper function to save album after discussion creation
const saveDownloadAlbum = async (discussionId: string) => {
  try {
    // Build the album node
    const albumNode = {
      imageOrder: formValues.value.album?.imageOrder || [],
      Images: {
        // Connect to existing images using their IDs
        connect: (formValues.value.album?.images || [])
          .filter((img): img is typeof img & { id: string } => Boolean(img.id))
          .map((img) => ({
            where: { node: { id: img.id } },
          })),
      },
    };

    // Create album structure similar to getUpdateDiscussionInputForAlbum
    const albumUpdateInput = {
      Album: {
        create: {
          node: albumNode,
        },
      },
    };

    await updateDiscussion({
      where: { id: discussionId },
      updateDiscussionInput: albumUpdateInput,
    });
  } catch (error) {
    console.error('Error creating album:', error);
  }
};

const saveDownloadSupportSettings = async (discussionId: string) => {
  await Promise.all(
    (formValues.value.downloadableFiles || [])
      .filter((file) => Boolean(file.id))
      .map((file) =>
        updateDownloadableFileSupportSettings({
          downloadableFileId: file.id,
          discussionId,
          input: {
            attributionOverride: file.attributionOverride || null,
            supportPatreonUrl: file.supportPatreonUrl || null,
            supportBuyMeACoffeeUrl: file.supportBuyMeACoffeeUrl || null,
            supportKoFiUrl: file.supportKoFiUrl || null,
            supportPayPalMeUrl: file.supportPayPalMeUrl || null,
          },
        })
      )
  );
};

// Helper function to save download labels after discussion creation
const saveDownloadLabels = async (discussionId: string) => {
  try {
    // Convert downloadLabels to FilterOption IDs
    const labelOptionIds: string[] = [];

    // We need the FilterGroups from channel data to map values to IDs
    if (!channelData.value?.FilterGroups) {
      console.warn('No FilterGroups found in channel data');
      return;
    }

    Object.entries(formValues.value.downloadLabels || {}).forEach(
      ([groupKey, selectedValues]) => {
        const filterGroup = channelData.value?.FilterGroups?.find(
          (fg: FilterGroup) => fg.key === groupKey
        );
        if (filterGroup) {
          selectedValues.forEach((value) => {
            const option = filterGroup.options?.find(
              (opt: FilterOption) => opt.value === value
            );
            if (option?.id) {
              labelOptionIds.push(option.id);
            }
          });
        }
      }
    );

    if (labelOptionIds.length > 0) {
      await updateDiscussionChannelLabels({
        discussionId: discussionId,
        channelUniqueName: channelId.value,
        labelOptionIds: labelOptionIds,
      });
    }
  } catch (error) {
    console.error('Error saving download labels:', error);
  }
};

const updateFormValues = (
  newValues: Partial<CreateEditDiscussionFormValues>
) => {
  formValues.value = { ...formValues.value, ...newValues };
};

const submitForm = async () => {
  try {
    if (channelData.value?.downloadsEnabled === false) {
      submitError.value = 'Downloads are disabled in this channel.';
      return;
    }

    submitError.value = '';
    const tagConnections = formValues.value.selectedTags.map((tag: string) => ({
      onCreate: {
        node: { text: tag },
      },
      where: {
        node: { text: tag },
      },
    }));

    // Build downloadable files connections
    const downloadableFileConnections = (
      formValues.value.downloadableFiles || []
    )
      .filter((file) => file.id) // Only connect files that have database IDs
      .map((file) => ({
        where: { node: { id: file.id } },
      }));

    // Album will be created as a follow-up mutation after discussion creation

    const discussionCreateInput = {
      title: formValues.value.title,
      body: formValues.value.body,
      hasDownload: true,
      Tags: { connectOrCreate: tagConnections },
      Author: {
        connect: {
          where: {
            node: { username: usernameVar.value },
          },
        },
      },
      ...(downloadableFileConnections.length > 0 && {
        DownloadableFiles: {
          connect: downloadableFileConnections,
        },
      }),
      ...(formValues.value.crosspostId && {
        CrosspostedDiscussion: {
          connect: {
            where: { node: { id: formValues.value.crosspostId } },
          },
        },
      }),
    };

    await createDownload({
      input: [
        {
          discussionCreateInput,
          channelConnections: formValues.value.selectedChannels,
        },
      ],
    });

    // Navigation is now handled in the onDone hook
  } catch (error) {
    console.error('Error creating download:', error);
    submitError.value =
      error instanceof Error ? error.message : 'Error creating download';
  }
};

watch(
  () => route.params.forumId,
  (newForumId) => {
    if (typeof newForumId === 'string' && newForumId !== channelId.value) {
      formValues.value.selectedChannels = [newForumId];
    }
  }
);
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-6">
    <div v-if="channelLoading">Loading channel data...</div>
    <template v-else>
      <ErrorBanner
        v-if="submitError"
        :text="submitError"
        class="mb-4"
      />
      <CreateEditDiscussionFields
        :edit-mode="false"
        :form-values="formValues"
        :create-discussion-error="createDownloadError"
        :create-discussion-loading="createDownloadLoading"
        :download-mode="true"
        :channel-data="channelData"
        @submit="submitForm"
        @update-form-values="updateFormValues"
      />
    </template>
  </div>
</template>
