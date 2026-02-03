<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import type {
  DiscussionChannel,
  DiscussionCreateInput,
} from '@/__generated__/graphql';
import {
  GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA,
  GET_CROSSPOST_PREVIEW,
} from '@/graphQLData/discussion/queries';
import { CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS } from '@/graphQLData/discussion/mutations';
import CreateEditDiscussionFields from '@/components/discussion/form/CreateEditDiscussionFields.vue';
import type { CreateEditDiscussionFormValues } from '@/types/Discussion';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import 'md-editor-v3/lib/style.css';
import {
  getSortFromQuery,
  getTimeFrameFromQuery,
} from '@/components/comments/getSortFromQuery';
import { usernameVar } from '@/cache';
import { useRouter, useRoute } from 'nuxt/app';
import { useChannelSuspensionNotice } from '@/composables/useSuspensionNotice';

const DISCUSSION_PAGE_LIMIT = 10;
const route = useRoute();
const router = useRouter();

const channelId: string = route.params.forumId
  ? String(route.params.forumId)
  : '';

const crosspostDiscussionId = computed(() => {
  const crosspostParam = route.query.crosspost;
  if (Array.isArray(crosspostParam)) {
    return crosspostParam[0] || null;
  }
  if (typeof crosspostParam === 'string') {
    return crosspostParam;
  }
  return null;
});

const createDiscussionDefaultValues: CreateEditDiscussionFormValues = {
  title: '',
  body: '',
  selectedChannels: channelId ? [channelId] : [],
  selectedTags: [],
  author: usernameVar.value,
  album: {
    images: [], // Will be populated with uploaded images that have IDs
    imageOrder: [],
  },
  crosspostId: crosspostDiscussionId.value,
};

const formValues = ref(createDiscussionDefaultValues);

watch(
  () => crosspostDiscussionId.value,
  (newVal) => {
    formValues.value = {
      ...formValues.value,
      crosspostId: newVal,
    };
  }
);

const {
  result: crosspostPreviewResult,
  loading: crosspostPreviewLoading,
  error: crosspostPreviewError,
} = useQuery(
  GET_CROSSPOST_PREVIEW,
  () => ({
    id: crosspostDiscussionId.value,
  }),
  {
    enabled: computed(() => !!crosspostDiscussionId.value),
    fetchPolicy: 'cache-first',
  }
);

const crosspostPreviewDiscussion = computed(() => {
  return crosspostPreviewResult.value?.discussions?.[0] || null;
});

const discussionCreateInput = computed<DiscussionCreateInput>(() => {
  const tagConnections = formValues.value.selectedTags.map((tag: string) => ({
    onCreate: {
      node: { text: tag },
    },
    where: {
      node: { text: tag },
    },
  }));

  const result: DiscussionCreateInput = {
    title: formValues.value.title,
    body: formValues.value.body,
    hasDownload: false,
    Tags: { connectOrCreate: tagConnections },
    Author: {
      connect: {
        where: {
          node: { username: usernameVar.value },
        },
      },
    },
  };

  if (formValues.value.album.images.length > 0) {
    // If imageOrder is empty or doesn't match the images length, reconstruct it from the images
    const imageIds = formValues.value.album.images.map((img) => img.id);

    // Images already have IDs from when they were uploaded and created in the database
    const validImages = formValues.value.album.images.filter(
      (image): image is (typeof image & { id: string }) => Boolean(image.id)
    );

    const albumNode: {
      imageOrder: string[];
      Images: {
        connect: { where: { node: { id: string } } }[];
      };
    } = {
      // Use the explicit imageOrder if it's valid, otherwise generate from image IDs
      imageOrder:
        formValues.value.album.imageOrder.length === imageIds.length
          ? formValues.value.album.imageOrder.filter((id) => id !== undefined)
          : imageIds.filter((id) => id !== undefined),
      Images: {
        connect: validImages.map((image) => ({
          where: { node: { id: image.id } },
        })),
      },
    };

    result.Album = {
      create: {
        node: albumNode,
      },
    };
  }

  if (formValues.value.crosspostId) {
    result.CrosspostedDiscussion = {
      connect: {
        where: {
          node: { id: formValues.value.crosspostId },
        },
      },
    };
  }

  return result;
});

const channelConnections = computed(() => formValues.value.selectedChannels);
const createDiscussionLoading = ref(false);
const submitError = ref<string | null>(null);
const submitAttempted = ref(false);

const {
  issueNumber: suspensionIssueNumber,
  suspendedUntil: suspensionUntil,
  suspendedIndefinitely: suspensionIndefinitely,
  channelId: suspensionChannelId,
} = useChannelSuspensionNotice(channelId);

const showSuspensionNotice = computed(() => {
  return submitAttempted.value && !!suspensionIssueNumber.value;
});

const {
  mutate: createDiscussion,
  error: createDiscussionError,
  onDone,
} = useMutation(CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS, () => ({
  errorPolicy: 'all',
  variables: {
    input: [
      {
        discussionCreateInput: discussionCreateInput.value,
        channelConnections: channelConnections.value,
      },
    ],
  },
  update: (cache, result) => {
    const discussionChannels =
      result.data?.createDiscussionWithChannelConnections?.DiscussionChannels ||
      [];
    const discussionChannelInCurrentChannel = discussionChannels.filter(
      (dc: DiscussionChannel) => dc?.Channel?.uniqueName === channelId
    );

    const existingData: {
      getDiscussionsInChannel?: {
        aggregateDiscussionChannelsCount?: number;
        discussionChannels?: any[];
      };
    } | null = cache.readQuery({
      query: GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA,
      variables: {
        channelUniqueName: channelId,
        searchInput: '',
        selectedTags: [],
        options: {
          limit: DISCUSSION_PAGE_LIMIT,
          offset: 0,
          sort: getSortFromQuery(route.query),
          timeFrame: getTimeFrameFromQuery(route.query),
        },
      },
    });

    const existingNumberOfDiscussionChannels =
      existingData?.getDiscussionsInChannel?.aggregateDiscussionChannelsCount ||
      0;

    cache.writeQuery({
      query: GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA,
      variables: {
        channelUniqueName: channelId,
        searchInput: '',
        selectedTags: [],
        options: {
          limit: DISCUSSION_PAGE_LIMIT,
          offset: 0,
          sort: getSortFromQuery(route.query),
          timeFrame: getTimeFrameFromQuery(route.query),
        },
      },
      data: {
        getDiscussionsInChannel: {
          aggregateDiscussionChannelsCount:
            existingNumberOfDiscussionChannels + 1,
          discussionChannels: [
            ...discussionChannelInCurrentChannel,
            ...(existingData?.getDiscussionsInChannel?.discussionChannels ||
              []),
          ],
        },
      },
    });
  },
}));

onDone((response) => {
  const newDiscussionArray =
    response.data?.createDiscussionWithChannelConnections;
  const newDiscussion = newDiscussionArray?.[0]?.DiscussionChannels?.[0];
  const newDiscussionId = newDiscussion?.Discussion?.id;
  createDiscussionLoading.value = false;

  if (!newDiscussionId) {
    submitError.value =
      'Unable to create discussion. Please check your permissions or try again.';
    return;
  }

  router.push({
    name: 'forums-forumId-discussions-discussionId',
    params: {
      forumId: channelId || formValues.value.selectedChannels[0],
      discussionId: newDiscussionId,
    },
  });
});

function submit() {
  if (!usernameVar.value) {
    console.error('No username found');
    return;
  }
  submitAttempted.value = true;
  submitError.value = null;
  createDiscussionLoading.value = true;
  createDiscussion();
}

function updateFormValues(data: Partial<CreateEditDiscussionFormValues>) {
  console.log('CreateDiscussion received form update:', JSON.stringify(data));

  // Handle album updates specially to avoid overwriting the entire album object
  if (data.album) {
    console.log('Album data detected in update:', data.album);

    // Explicitly handle images and imageOrder to ensure they stay in sync
    if (data.album.images) {
      console.log('Updating album images:', data.album.images);
      formValues.value.album.images = data.album.images;
    }

    if (data.album.imageOrder) {
      console.log('Updating album imageOrder:', data.album.imageOrder);
      formValues.value.album.imageOrder = data.album.imageOrder;
    }

    // Remove album from data to prevent double-application
    const { album, ...restData } = data;

    // Update the rest of the form values
    formValues.value = {
      ...formValues.value,
      ...restData,
    };

    console.log('Updated form values:', JSON.stringify(formValues.value.album));
  } else {
    // If no album data, just update normally
    formValues.value = {
      ...formValues.value,
      ...data,
    };
  }
}
</script>

<template>
  <RequireAuth>
    <template #has-auth>
      <CreateEditDiscussionFields
        :create-discussion-error="createDiscussionError"
        :create-discussion-loading="createDiscussionLoading"
        :edit-mode="false"
        :form-values="formValues"
        :download-mode="false"
        :submit-error="submitError"
        :suspension-issue-number="
          showSuspensionNotice ? suspensionIssueNumber : null
        "
        :suspension-channel-id="
          showSuspensionNotice ? suspensionChannelId : ''
        "
        :suspension-until="showSuspensionNotice ? suspensionUntil : null"
        :suspension-indefinitely="
          showSuspensionNotice ? suspensionIndefinitely : null
        "
        :crossposted-discussion="crosspostPreviewDiscussion"
        :crosspost-error="crosspostPreviewError"
        :crosspost-loading="crosspostPreviewLoading"
        @submit="submit"
        @update-form-values="updateFormValues"
      />
    </template>
    <template #does-not-have-auth>
      <div class="flex justify-center p-8 dark:text-white">
        You don't have permission to see this page.
      </div>
    </template>
  </RequireAuth>
</template>

<style></style>
