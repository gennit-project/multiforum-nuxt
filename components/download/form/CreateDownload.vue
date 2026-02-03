<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import { useMutation, useQuery } from '@vue/apollo-composable';
import CreateEditDiscussionFields from '@/components/discussion/form/CreateEditDiscussionFields.vue';
import {
  CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS,
  UPDATE_DISCUSSION_CHANNEL_LABELS,
  UPDATE_DISCUSSION,
} from '@/graphQLData/discussion/mutations';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import type { CreateEditDiscussionFormValues } from '@/types/Discussion';
import type { FilterGroup, FilterOption } from '@/__generated__/graphql';
import { usernameVar } from '@/cache';

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
} = useMutation(UPDATE_DISCUSSION_CHANNEL_LABELS);

const {
  mutate: updateDiscussion,
  loading: _updateDiscussionLoading,
  error: _updateDiscussionError,
} = useMutation(UPDATE_DISCUSSION);

onDone(async (response) => {
  console.log('CreateDownload onDone response:', response);
  console.log('Full response.data:', response.data);
  console.log(
    'createDiscussionWithChannelConnections:',
    response.data?.createDiscussionWithChannelConnections
  );

  // Try both possible response structures
  const directId = response.data?.createDiscussionWithChannelConnections?.id;
  const arrayId =
    response.data?.createDiscussionWithChannelConnections?.[0]
      ?.DiscussionChannels?.[0]?.Discussion?.id;

  const newDiscussionId = directId || arrayId;
  console.log('Extracted discussionId:', newDiscussionId);

  if (newDiscussionId) {
    // Handle album if there are images
    if (formValues.value.album?.images?.length > 0) {
      console.log('Saving album images:', formValues.value.album.images);
      await saveDownloadAlbum(newDiscussionId);
    }

    // Handle labels if they exist
    if (
      formValues.value.downloadLabels &&
      Object.keys(formValues.value.downloadLabels).length > 0
    ) {
      console.log('Saving download labels:', formValues.value.downloadLabels);
      await saveDownloadLabels(newDiscussionId);
    }

    console.log('Navigating to download detail page:', {
      forumId: channelId.value,
      discussionId: newDiscussionId,
    });
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
    console.log('Creating album for discussion:', discussionId);
    console.log('Album data:', formValues.value.album);

    // Build the album node
    const albumNode: any = {
      imageOrder: formValues.value.album?.imageOrder || [],
      Images: {
        // Connect to existing images using their IDs
        connect: (formValues.value.album?.images || [])
          .filter((img) => Boolean(img.id))
          .map((img) => ({
            where: { node: { id: img.id } },
          })),
      },
    };

    // Set the Owner to the current logged-in user
    if (usernameVar.value) {
      albumNode.Owner = {
        connect: {
          where: { node: { username: usernameVar.value } },
        },
      };
    }

    // Create album structure similar to getUpdateDiscussionInputForAlbum
    const albumUpdateInput = {
      Album: {
        create: {
          node: albumNode,
        },
      },
    };

    console.log(
      'Album update input:',
      JSON.stringify(albumUpdateInput, null, 2)
    );

    await updateDiscussion({
      where: { id: discussionId },
      updateDiscussionInput: albumUpdateInput,
    });

    console.log('Successfully created album');
  } catch (error) {
    console.error('Error creating album:', error);
  }
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

    console.log(
      'Converting downloadLabels to FilterOption IDs:',
      formValues.value.downloadLabels
    );
    console.log('Available FilterGroups:', channelData.value.FilterGroups);

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

    console.log('Final labelOptionIds to connect:', labelOptionIds);

    if (labelOptionIds.length > 0) {
      await updateDiscussionChannelLabels({
        channelUniqueName: channelId.value,
        discussionId: discussionId,
        labelOptionIds: labelOptionIds,
      });
      console.log('Successfully saved download labels');
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
    console.log(
      'CreateDownload submitForm - formValues.album:',
      formValues.value.album
    );
    console.log(
      'CreateDownload submitForm - album images:',
      formValues.value.album?.images
    );

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
    <CreateEditDiscussionFields
      v-else
      :edit-mode="false"
      :form-values="formValues"
      :create-discussion-error="createDownloadError"
      :create-discussion-loading="createDownloadLoading"
      :download-mode="true"
      :channel-data="channelData"
      @submit="submitForm"
      @update-form-values="updateFormValues"
    />
  </div>
</template>
