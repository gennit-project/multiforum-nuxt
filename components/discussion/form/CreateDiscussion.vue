<script lang="ts" setup>
import { ref, computed } from "vue";
import { useMutation } from "@vue/apollo-composable";
import type {
  DiscussionChannel,
  DiscussionCreateInput,
} from "@/__generated__/graphql";
import { GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA } from "@/graphQLData/discussion/queries";
import { CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS } from "@/graphQLData/discussion/mutations";
import CreateEditDiscussionFields from "@/components/discussion/form/CreateEditDiscussionFields.vue";
import type { CreateEditDiscussionFormValues } from "@/types/Discussion";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import "md-editor-v3/lib/style.css";
import {
  getSortFromQuery,
  getTimeFrameFromQuery,
} from "@/components/comments/getSortFromQuery";
import { usernameVar } from "@/cache";
import { useRouter, useRoute } from "nuxt/app";

const DISCUSSION_PAGE_LIMIT = 10;
const route = useRoute();
const router = useRouter();

const channelId: string = route.params.forumId
  ? String(route.params.forumId)
  : "";

const createDiscussionDefaultValues: CreateEditDiscussionFormValues = {
  title: "",
  body: "",
  selectedChannels: channelId ? [channelId] : [],
  selectedTags: [],
  author: usernameVar.value,
};

const formValues = ref(createDiscussionDefaultValues);

const discussionCreateInput = computed<DiscussionCreateInput>(() => {
  const tagConnections = formValues.value.selectedTags.map((tag: string) => ({
    onCreate: {
      node: { text: tag },
    },
    where: {
      node: { text: tag },
    },
  }));

  return {
    title: formValues.value.title,
    body: formValues.value.body,
    Tags: { connectOrCreate: tagConnections },
    Author: {
      connect: {
        where: {
          node: { username: usernameVar.value },
        },
      },
    },
  };
});

const channelConnections = computed(() => formValues.value.selectedChannels);
const createDiscussionLoading = ref(false);

const {
  mutate: createDiscussion,
  error: createDiscussionError,
  onDone,
} = useMutation(CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS, () => ({
  errorPolicy: "all",
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

    const existingData: any = cache.readQuery({
      query: GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA,
      variables: {
        channelUniqueName: channelId,
        searchInput: "",
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
        searchInput: "",
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
  const newDiscussionArray =  response.data?.createDiscussionWithChannelConnections
  const newDiscussion = newDiscussionArray?.[0]?.DiscussionChannels?.[0]
  const newDiscussionId = newDiscussion?.Discussion?.id;
  createDiscussionLoading.value = false;
  console.log(  'on done', newDiscussionId)

  router.push({
    name: "forums-forumId-discussions-discussionId",
    params: {
      forumId: channelId || formValues.value.selectedChannels[0],
      discussionId: newDiscussionId,
    },
  });
});

function submit() {
  if (!usernameVar.value) {
    console.error("No username found");
    return;
  }
  createDiscussionLoading.value = true;
  createDiscussion();
}

function updateFormValues(data: CreateEditDiscussionFormValues) {
  formValues.value = {
    ...formValues.value,
    ...data,
  };
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
