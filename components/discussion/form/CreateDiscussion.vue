<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { buildAlbumUpdateInput } from '@/utils/albumUpdateInput';
import { appendCreatedDiscussion } from '@/utils/discussionCreateCache';
import { useMutation, useQuery } from '@vue/apollo-composable';
import {
  CreateDiscussionDocument as CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS,
  GetCrosspostPreviewDocument as GET_CROSSPOST_PREVIEW,
  GetChannelDiscussionFlairConfigDocument as GET_CHANNEL_DISCUSSION_FLAIR_CONFIG,
} from '@/__generated__/operations';
import CreateEditDiscussionFields from '@/components/discussion/form/CreateEditDiscussionFields.vue';
import type { CreateEditDiscussionFormValues } from '@/types/Discussion';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import AccessDeniedMessage from '@/components/auth/AccessDeniedMessage.vue';
import 'md-editor-v3/lib/style.css';
import { useRouter, useRoute } from 'nuxt/app';
import { useChannelSuspensionNotice } from '@/composables/useSuspensionNotice';
import { useForumLock } from '@/composables/useForumLock';
import { useUsername } from '@/composables/useAuthState';
import {
  useChannelDiscussionFlairConfigs,
  type ChannelDiscussionFlairConfig,
} from '@/composables/useChannelDiscussionFlairConfigs';

const usernameVar = useUsername();

const route = useRoute();
const router = useRouter();

const channelId = computed(() =>
  typeof route.params.forumId === 'string' ? route.params.forumId : ''
);

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
  selectedChannels: channelId.value ? [channelId.value] : [],
  selectedFlairIdsByChannel: {},
  selectedTags: [],
  author: usernameVar.value,
  album: {
    images: [], // Will be populated with uploaded images that have IDs
    imageOrder: [],
  },
  crosspostId: crosspostDiscussionId.value,
};

const formValues = ref(createDiscussionDefaultValues);

const {
  result: flairConfigResult,
  loading: scopedDiscussionFlairsLoading,
  error: scopedDiscussionFlairsQueryError,
} = useQuery(
  GET_CHANNEL_DISCUSSION_FLAIR_CONFIG,
  () => ({
    channelUniqueName: channelId.value,
    includeArchived: false,
  }),
  { enabled: computed(() => Boolean(channelId.value)) }
);

const flairConfig = computed<ChannelDiscussionFlairConfig | null>(
  () => flairConfigResult.value?.getChannelDiscussionFlairConfig || null
);

const sitewideSelectedChannels = computed(() =>
  channelId.value ? [] : formValues.value.selectedChannels
);
const {
  configs: sitewideFlairConfigs,
  loadingChannels: sitewideFlairsLoadingChannels,
  errorsByChannel: sitewideFlairsErrorsByChannel,
} = useChannelDiscussionFlairConfigs(sitewideSelectedChannels);

const effectiveFlairConfigs = computed(() =>
  channelId.value
    ? flairConfig.value
      ? [flairConfig.value]
      : []
    : sitewideFlairConfigs.value
);

const flairLoadingChannels = computed(() =>
  channelId.value && scopedDiscussionFlairsLoading.value
    ? [channelId.value]
    : sitewideFlairsLoadingChannels.value
);

const flairErrorsByChannel = computed<Record<string, string>>(() => {
  if (channelId.value && scopedDiscussionFlairsQueryError.value) {
    return {
      [channelId.value]: scopedDiscussionFlairsQueryError.value.message,
    };
  }
  return sitewideFlairsErrorsByChannel.value;
});

const channelFlairSelections = computed(() => {
  return formValues.value.selectedChannels.flatMap((channelUniqueName) => {
    const flairIds =
      formValues.value.selectedFlairIdsByChannel?.[channelUniqueName] || [];
    return flairIds.length > 0 ? [{ channelUniqueName, flairIds }] : [];
  });
});

const missingRequiredFlairConfig = computed(() =>
  effectiveFlairConfigs.value.find(
    (config) =>
      config.flairRequired &&
      (formValues.value.selectedFlairIdsByChannel?.[config.channelUniqueName]
        ?.length || 0) === 0
  )
);

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
    id: crosspostDiscussionId.value || '',
  }),
  {
    enabled: computed(() => !!crosspostDiscussionId.value),
    fetchPolicy: 'cache-first',
  }
);

const crosspostPreviewDiscussion = computed(() => {
  return crosspostPreviewResult.value?.discussions?.[0] || null;
});

const discussionCreateInput = computed(() => {
  const tagConnections = formValues.value.selectedTags.map((tag: string) => ({
    where: { node: { text: { eq: tag } } },
  }));

  const result = {
    title: formValues.value.title,
    body: formValues.value.body,
    hasDownload: false,
    // v7 removed `connectOrCreate`; attach existing tags with `connect` (the
    // backend merges-if-missing server-side).
    Tags: {
      connect: tagConnections,
    },
    // The pinned backend derives Author from authenticated context.
  };

  const albumInput = buildAlbumUpdateInput({ albumData: formValues.value.album });
  const album = albumInput && {
    create: {
      node: {
        imageOrder: albumInput.imageIds,
        Images: {
          connect: albumInput.imageIds.map((id) => ({
            where: { node: { id: { eq: id } } },
          })),
        },
      },
    },
  };

  return {
    ...result,
    ...(album ? { Album: album } : {}),

  };
});

const channelConnections = computed(() => formValues.value.selectedChannels);
const submitError = ref<string | null>(null);
const submitAttempted = ref(false);

const { lockError } = useForumLock(channelId);

// Surface the lock notice immediately (not just after a submit attempt), mirroring
// the channel-preference gate in CreateEvent.
const formSubmitError = computed(() => submitError.value ?? lockError.value);

const {
  issueNumber: suspensionIssueNumber,
  suspendedUntil: suspensionUntil,
  suspendedIndefinitely: suspensionIndefinitely,
  channelId: suspensionChannelId,
} = useChannelSuspensionNotice(channelId);

const showSuspensionNotice = computed(() => {
  return submitAttempted.value && !!suspensionIssueNumber.value;
});

const createVariables = () => ({
  input: [
    {
      discussionCreateInput: discussionCreateInput.value,
      channelConnections: channelConnections.value,
      ...(formValues.value.crosspostId ? { crosspostedDiscussionId: formValues.value.crosspostId } : {}),
      channelFlairSelections: channelFlairSelections.value,
    },
  ],
});

const {
  mutate: createDiscussion,
  loading: createDiscussionLoading,
  error: createDiscussionError,
  onDone,
} = useMutation(
  CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS,
  () => ({
    errorPolicy: 'all',
    variables: createVariables(),
    update: (cache, result) => {
      appendCreatedDiscussion(cache, result.data);
    },
  })
);

let routeGeneration = 0;
watch(channelId, () => { routeGeneration++; });
let submittedGeneration = routeGeneration;
let submittedRoute = channelId.value;
let submittedChannel = channelId.value;
const completedDiscussionIds = new Set<string>();
onDone((response) => {
  if (routeGeneration !== submittedGeneration || channelId.value !== submittedRoute) return;
  const newDiscussionArray =
    response.data?.createDiscussionWithChannelConnections;
  const newDiscussion = newDiscussionArray?.[0]?.DiscussionChannels?.[0];
  const newDiscussionId = newDiscussion?.Discussion?.id;

  if (!newDiscussionId) {
    submitError.value =
      'Unable to create discussion. Please check your permissions or try again.';
    return;
  }

  if (completedDiscussionIds.has(newDiscussionId)) return;
  completedDiscussionIds.add(newDiscussionId);
  router.push({
    name: 'forums-forumId-discussions-discussionId',
    params: {
      forumId: submittedChannel,
      discussionId: newDiscussionId,
    },
  });
});

function submit() {
  if (createDiscussionLoading.value) return;
  if (!usernameVar.value) {
    console.error('No username found');
    return;
  }
  submitAttempted.value = true;
  submitError.value = null;
  if (lockError.value) {
    submitError.value = lockError.value;
    return;
  }
  if (flairLoadingChannels.value.length > 0) {
    submitError.value = 'Wait for the forum flair options to finish loading.';
    return;
  }
  if (Object.keys(flairErrorsByChannel.value).length > 0) {
    submitError.value =
      'Unable to load the forum flair options. Please try again.';
    return;
  }
  if (missingRequiredFlairConfig.value) {
    submitError.value = `Select at least one flair for ${missingRequiredFlairConfig.value.channelUniqueName}.`;
    return;
  }
  submittedGeneration = routeGeneration;
  submittedRoute = channelId.value;
  submittedChannel = channelId.value || formValues.value.selectedChannels[0] || '';
  createDiscussion();
}

function updateFormValues(data: Partial<CreateEditDiscussionFormValues>) {
  if (data.selectedChannels) {
    const selectedChannels = new Set(data.selectedChannels);
    data = {
      ...data,
      selectedFlairIdsByChannel: Object.fromEntries(
        Object.entries(formValues.value.selectedFlairIdsByChannel || {}).filter(
          ([channel]) => selectedChannels.has(channel)
        )
      ),
    };
  }

  // Handle album updates specially to avoid overwriting the entire album object
  if (data.album) {
    // Explicitly handle images and imageOrder to ensure they stay in sync
    if (data.album.images) {
      formValues.value.album.images = data.album.images;
    }

    if (data.album.imageOrder) {
      formValues.value.album.imageOrder = data.album.imageOrder;
    }

    // Remove album from data to prevent double-application
    const { album, ...restData } = data;

    // Update the rest of the form values
    formValues.value = {
      ...formValues.value,
      ...restData,
    };
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
        :submit-error="formSubmitError"
        :suspension-issue-number="
          showSuspensionNotice ? suspensionIssueNumber : null
        "
        :suspension-channel-id="showSuspensionNotice ? suspensionChannelId : ''"
        :suspension-until="showSuspensionNotice ? suspensionUntil : null"
        :suspension-indefinitely="
          showSuspensionNotice ? suspensionIndefinitely : null
        "
        :crossposted-discussion="crosspostPreviewDiscussion"
        :crosspost-error="crosspostPreviewError"
        :crosspost-loading="crosspostPreviewLoading"
        :locked-channel-name="channelId || undefined"
        :locked-channel-label="channelId || undefined"
        :discussion-flairs="flairConfig?.flairs || []"
        :discussion-flair-required="flairConfig?.flairRequired || false"
        :discussion-flairs-loading="scopedDiscussionFlairsLoading"
        :discussion-flairs-error="scopedDiscussionFlairsQueryError?.message"
        :discussion-flair-configs="sitewideFlairConfigs"
        :discussion-flairs-loading-channels="sitewideFlairsLoadingChannels"
        :discussion-flairs-errors-by-channel="sitewideFlairsErrorsByChannel"
        @submit="submit"
        @update-form-values="updateFormValues"
      />
    </template>
    <template #does-not-have-auth>
      <AccessDeniedMessage action="start a discussion" />
    </template>
  </RequireAuth>
</template>

<style></style>
