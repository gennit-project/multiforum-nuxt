<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  useMutation,
  useQuery,
} from "@vue/apollo-composable";
import type { DiscussionChannel , DiscussionCreateInput } from "@/__generated__/graphql";
import { GET_DISCUSSIONS_WITH_DISCUSSION_CHANNEL_DATA } from "@/graphQLData/discussion/queries";
import { CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS } from "@/graphQLData/discussion/mutations";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import CreateEditDiscussionFields from "@/components/discussion/form/CreateEditDiscussionFields.vue";
import type { CreateEditDiscussionFormValues } from "@/types/Discussion";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import "md-editor-v3/lib/style.css";
import {
  getSortFromQuery,
  getTimeFrameFromQuery,
} from "@/components/comments/getSortFromQuery";

const DISCUSSION_PAGE_LIMIT = 10;

export default defineComponent({
  name: "CreateDiscussion",
  components: {
    CreateEditDiscussionFields,
    RequireAuth,
  },
  apollo: {},
  setup() {

    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      const username = localUsernameResult.value?.username;
      if (username) {
        return username;
      }
      return "";
    });

    const route = useRoute();
    const router = useRouter();

    const channelId: string = `${
      route.params.forumId ? route.params.forumId : ""
    }`;

    const createDiscussionDefaultValues: CreateEditDiscussionFormValues = {
      title: "",
      body: "",
      selectedChannels: channelId ? [channelId] : [],
      selectedTags: [],
      author: username.value,
    };

    const formValues = ref(createDiscussionDefaultValues);

    const discussionCreateInput = computed<DiscussionCreateInput>(() => {
      const tagConnections = formValues.value.selectedTags.map(
        (tag: string) => {
          return {
            onCreate: {
              node: {
                text: tag,
              },
            },
            where: {
              node: {
                text: tag,
              },
            },
          };
        },
      );

      const input = {
        title: formValues.value.title,
        body: formValues.value.body,
        Tags: {
          connectOrCreate: tagConnections,
        },
        Author: {
          connect: {
            where: {
              node: {
                username: username.value,
              },
            },
          },
        },
      };

      return input;
    });

    const channelConnections = computed(() => {
      return formValues.value.selectedChannels;
    });

    const createDiscussionLoading = ref(false);

    const {
      mutate: createDiscussion,
      error: createDiscussionError,
      onDone,
    } = useMutation(CREATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS, () => ({
      errorPolicy: "all",
      variables: {
        discussionCreateInput: discussionCreateInput.value,
        channelConnections: channelConnections.value,
      },
      update: (cache: any, result: any) => {
        // May need to use this data to fix console errors about missing fields
        // while writing result:
        // const newDiscussion: Discussion =
        //   result.data?.createDiscussionWithChannelConnections;
        // console.log("result", result);

        // const newDiscussionData = result?.data?.createDiscussionWithChannelConnections;

        const discussionChannels =
          result.data?.createDiscussionWithChannelConnections
            ?.DiscussionChannels || [];

        const discussionChannelInCurrentChannel = discussionChannels.filter(
          (dc: DiscussionChannel) => {
            return dc?.Channel?.uniqueName === channelId;
          },
        );

        const existingData = cache.readQuery({
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
          existingData?.getDiscussionsInChannel?.aggregateDiscussionChannelsCount || 0;

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
                ...existingData?.getDiscussionsInChannel?.discussionChannels || [],
              ],
            },
          },
        });
      },
    }));

    onDone((response: any) => {
      const newDiscussionId =
        response.data?.createDiscussionWithChannelConnections.id;

      /*
        If the discussion was created in the context
        of a channel, redirect to the discussion detail page in
        the channel.
      */
      createDiscussionLoading.value = false;

      if (channelId) {
        router.push({
          name: "forums-forumId-discussions-discussionId",
          params: {
            forumId: channelId,
            discussionId: newDiscussionId,
          },
        });
      } else {
        /*
          If the discussion was created in the context
          of the server-wide discussions page,
          redirect to the discussion detail page in the first
          channel that the discussion was submitted to.
        */
        router.push({
          name: "forums-forumId-discussions-discussionId",
          params: {
            forumId: formValues.value.selectedChannels[0],
            discussionId: newDiscussionId,
          },
        });
      }
    });

    return {
      channelId,
      createDiscussion,
      createDiscussionError,
      createDiscussionLoading,
      formValues,
      router,
      username,
    };
  },

  methods: {
    async submit() {
      if (!this.username) {
        console.error("No username found");
        return;
      }
      this.createDiscussionLoading = true;
      this.createDiscussion();
    },
    updateFormValues(data: CreateEditDiscussionFormValues) {
      const existingValues = this.formValues;

      this.formValues = {
        ...existingValues,
        ...data,
      };
    },
  },
});
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
      <div class="flex justify-center p-8">
        You don't have permission to see this page.
      </div>
    </template>
  </RequireAuth>
</template>

<style></style>
