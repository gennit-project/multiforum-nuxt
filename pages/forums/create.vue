<script lang="ts" setup>
  import { ref, computed } from "vue";
  import { useMutation } from "@vue/apollo-composable";
  import { gql } from "@apollo/client/core";
  import CreateEditChannelFields from "@/components/channel/form/CreateEditChannelFields.vue";
  import RequireAuth from "@/components/auth/RequireAuth.vue";
  import { CREATE_CHANNEL } from "@/graphQLData/channel/mutations";
  import type {
    Channel,
    ChannelCreateInput,
    ChannelTagsConnectOrCreateFieldInput,
  } from "@/__generated__/graphql";
  import { usernameVar } from "@/cache";

  const router = useRouter();

  const createChannelDefaultValues = {
    uniqueName: "",
    displayName: "",
    description: "",
    channelIconURL: "",
    channelBannerURL: "",
    selectedTags: [],
    rules: [],
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
        wikiEnabled: true,
        rules: JSON.stringify(formValues.value.rules),
        Tags: {
          connectOrCreate: tagConnections,
        },
        Admins: {
          connect: [
            {
              where: {
                node: {
                  username: usernameVar.value,
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
    update: (cache, result) => {
      const newChannel: Channel = result.data?.createChannels?.channels[0];

      cache.modify({
        fields: {
          channels(existingChannels = []) {
            const newChannelRef = cache.writeFragment({
              data: newChannel,
              fragment: gql`
                fragment NewChannel on Channel {
                  uniqueName
                  description
                  channelIconURL
                  channelBannerURL
                  Admins
                  Tags
                }
              `,
            });
            return [...existingChannels, newChannelRef];
          },
        },
      });
    },
  }));

  onDone((response) => {
    const newChannelId = response.data.createChannels.channels[0].uniqueName;
    createChannelLoading.value = false;

    router.push({
      name: "forums-forumId-discussions",
      params: {
        forumId: newChannelId,
      },
    });
  });

  const submit = async () => {
    createChannelLoading.value = true;
    if (!usernameVar.value) {
      console.error("No username found");
      return;
    }
    createChannel({
      createChannelInput: createChannelInput.value,
    });
  };

  const updateFormValues = (data: any) => {
    formValues.value = {
      ...formValues.value,
      ...data,
    };
  };
</script>

<template>
  <NuxtLayout>
    <div class="flex justify-center">
      <div class="mt-2 w-full max-w-3xl bg-white px-2 pt-2 dark:bg-gray-800">
        <RequireAuth>
          <template #has-auth>
            <div class="w-full">
              <CreateEditChannelFields
                :create-channel-error="createChannelError"
                :create-channel-loading="createChannelLoading"
                :edit-mode="false"
                :form-values="formValues"
                @submit="submit"
                @update-form-values="updateFormValues"
              />
            </div>
          </template>
          <template #does-not-have-auth>
            <div class="flex justify-center p-8 dark:text-white">
              You don't have permission to see this page
            </div>
          </template>
        </RequireAuth>
      </div>
    </div>
  </NuxtLayout>
</template>
