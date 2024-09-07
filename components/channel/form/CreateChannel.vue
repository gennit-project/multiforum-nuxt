<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import type { CreateEditChannelFormValues } from "@/types/Channel";
import { CREATE_CHANNEL } from "@/graphQLData/channel/mutations";
import { useMutation, provideApolloClient , useQuery } from "@vue/apollo-composable";
import { gql } from "@apollo/client/core";
import { apolloClient } from "@/main";
import CreateEditChannelFields from "./CreateEditChannelFields.vue";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import type {
  Channel,
  ChannelCreateInput,
  ChannelTagsConnectOrCreateFieldInput,
} from "@/__generated__/graphql";

export default defineComponent({
  name: "CreateChannel",
  components: {
    CreateEditChannelFields,
    RequireAuth,
  },
  apollo: {},
  setup() {
    provideApolloClient(apolloClient);
    const route = useRoute();
    const router = useRouter();

    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      const username = localUsernameResult.value?.username;
      if (username) {
        return username;
      }
      return "";
    });

    const channelId: string | string[] = route.params.forumId;

    const createChannelDefaultValues: CreateEditChannelFormValues = {
      uniqueName: "",
      displayName: "",
      description: "",
      channelIconURL: "",
      channelBannerURL: "",
      selectedTags: [],
      rules: []
    };

    const formValues = ref(createChannelDefaultValues);

    const createChannelInput = computed(() => {
      const tagConnections: ChannelTagsConnectOrCreateFieldInput[] =
        formValues.value.selectedTags.map((tag: string) => {
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
        });

      const result: ChannelCreateInput[] = [
        {
          uniqueName: formValues.value.uniqueName,
          description: formValues.value.description,
          displayName: formValues.value.displayName,
          channelIconURL: formValues.value.channelIconURL,
          channelBannerURL: formValues.value.channelBannerURL,
          Tags: {
            connectOrCreate: tagConnections,
          },
          Admins: {
            connect: [
              {
                where: {
                  node: {
                    username: username.value,
                  },
                },
              },
            ],
          },
        },
      ];
      return result;
    });

    const createChannelLoading = ref(false);

    const {
      mutate: createChannel,
      error: createChannelError,
      onDone,
    } = useMutation(CREATE_CHANNEL, () => ({
      variables: {
        createChannelInput: createChannelInput.value,
      },
      update: (cache: any, result: any) => {
        const newChannel: Channel = result.data?.createChannels?.channels[0];

        cache.modify({
          fields: {
            channels(existingChannelRefs = [], fieldInfo: any) {
              const readField = fieldInfo.readField;
              const newChannelRef = cache.writeFragment({
                data: newChannel,
                fragment: gql`
                  fragment NewChannel on Channels {
                    uniqueName
                  }
                `,
              });

              // Quick safety check - if the new channel is already
              // present in the cache, we don't need to add it again.
              if (
                existingChannelRefs.some(
                  (ref: any) =>
                    readField("uniqueName", ref) === newChannel.uniqueName,
                )
              ) {
                return existingChannelRefs;
              }
              return [newChannelRef, ...existingChannelRefs];
            },
          },
        });
      },
    }));

    onDone((response: any) => {
      const newChannelId = response.data.createChannels.channels[0].uniqueName;
      createChannelLoading.value = false;

      router.push({
        name: "SearchDiscussionsInChannel",
        params: {
          forumId: newChannelId,
        },
      });
    });

    return {
      channelId,
      createChannel,
      createChannelError,
      createChannelLoading,
      createChannelInput,
      formValues,
      router,
    };
  },
  methods: {
    async submit() {
      this.createChannelLoading = true;
      this.createChannel();
    },
    updateFormValues(data: CreateEditChannelFormValues) {
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
      <CreateEditChannelFields
        :create-channel-error="createChannelError"
        :edit-mode="false"
        :form-values="formValues"
        :create-channel-loading="createChannelLoading"
        @submit="submit"
        @update-form-values="updateFormValues"
      />
    </template>
    <template #does-not-have-auth>
      <div class="flex justify-center p-8">
        You don't have permission to see this page
      </div>
    </template>
  </RequireAuth>
</template>
