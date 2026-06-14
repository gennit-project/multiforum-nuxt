<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { gql } from '@apollo/client/core';
import CreateEditChannelFields from '@/components/channel/form/CreateEditChannelFields.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import { CREATE_CHANNEL } from '@/graphQLData/channel/mutations';
import type {
  Channel,
  ChannelCreateInput,
  ChannelTagsConnectOrCreateFieldInput,
} from '@/__generated__/graphql';
import type { CreateEditChannelFormValues } from '@/types/Channel';
import { usernameVar } from '@/cache';
import { useRouter } from 'nuxt/app';
import { useServerSuspensionNotice } from '@/composables/useSuspensionNotice';

const router = useRouter();

const createChannelDefaultValues: CreateEditChannelFormValues = {
  uniqueName: '',
  displayName: '',
  description: '',
  channelIconURL: '',
  channelBannerURL: '',
  selectedTags: [],
  rules: [],
  wikiEnabled: false,
  downloadsEnabled: false,
  allowedFileTypes: [],
  downloadFilterGroups: [],
  eventsEnabled: true,
  feedbackEnabled: true,
  imageUploadsEnabled: true,
  markdownImagesEnabled: true,
  emojiEnabled: true,
};

const formValues = ref<CreateEditChannelFormValues>(createChannelDefaultValues);

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
      rules: JSON.stringify(formValues.value.rules),
      eventsEnabled: formValues.value.eventsEnabled,
      feedbackEnabled: formValues.value.feedbackEnabled,
      imageUploadsEnabled: formValues.value.imageUploadsEnabled,
      markdownImagesEnabled: formValues.value.markdownImagesEnabled,
      emojiEnabled: formValues.value.emojiEnabled,
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

const submitError = ref<string | null>(null);
const submitAttempted = ref(false);

const {
  issueNumber: suspensionIssueNumber,
  suspendedUntil: suspensionUntil,
  suspendedIndefinitely: suspensionIndefinitely,
  channelId: suspensionChannelId,
} = useServerSuspensionNotice();

const showSuspensionNotice = computed(() => {
  return submitAttempted.value && !!suspensionIssueNumber.value;
});

const {
  mutate: createChannel,
  error: createChannelError,
  loading: createChannelLoading,
  onDone,
  onError,
} = useMutation(CREATE_CHANNEL, () => ({
  update: (cache, result) => {
    const newChannel: Channel = result.data?.createChannels?.channels[0];
    if (!newChannel?.uniqueName) {
      return;
    }

    cache.modify({
      fields: {
        channels(existingChannels = []) {
          const newChannelRef = cache.writeFragment({
            id: cache.identify({
              __typename: 'Channel',
              uniqueName: newChannel.uniqueName,
            }),
            data: {
              ...newChannel,
              __typename: 'Channel',
            },
            fragment: gql`
              fragment NewChannel on Channel {
                __typename
                uniqueName
                description
                channelIconURL
                channelBannerURL
                Admins
                Tags
              }
            `,
          });
          if (!newChannelRef) {
            return existingChannels;
          }
          return [...existingChannels, newChannelRef];
        },
      },
    });
  },
}));

onDone((response) => {
  const newChannelId = response.data.createChannels.channels[0]?.uniqueName;
  if (!newChannelId) {
    submitError.value =
      'Unable to create forum. Please check your permissions or try again.';
    return;
  }

  router.push({
    name: 'forums-forumId-discussions',
    params: {
      forumId: newChannelId,
    },
  });
});

onError(() => {
  submitError.value = null;
});

const submit = async () => {
  submitAttempted.value = true;
  submitError.value = null;
  if (!usernameVar.value) {
    console.error('No username found');
    return;
  }
  createChannel({
    createChannelInput: createChannelInput.value,
  });
};

const updateFormValues = (data: Partial<CreateEditChannelFormValues>) => {
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
                :edit-mode="false"
                :form-values="formValues"
                :create-channel-loading="createChannelLoading"
                :submit-error="submitError ?? undefined"
                :suspension-issue-number="
                  showSuspensionNotice
                    ? suspensionIssueNumber ?? undefined
                    : undefined
                "
                :suspension-channel-id="
                  showSuspensionNotice
                    ? suspensionChannelId ?? undefined
                    : undefined
                "
                :suspension-until="
                  showSuspensionNotice ? suspensionUntil ?? undefined : undefined
                "
                :suspension-indefinitely="
                  showSuspensionNotice ? suspensionIndefinitely ?? false : false
                "
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
