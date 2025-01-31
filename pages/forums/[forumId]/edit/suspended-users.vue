<script lang="ts" setup>
import PendingForumOwnerList from "@/components/channel/form/PendingForumOwnerList.vue";
import ForumOwnerList from "@/components/channel/form/ForumOwnerList.vue";
import { ref, computed } from "vue";
import { useMutation } from "@vue/apollo-composable";
import {
  INVITE_FORUM_OWNER,
  CANCEL_INVITE_FORUM_OWNER,
  REMOVE_FORUM_OWNER,
} from "@/graphQLData/mod/mutations";
import { useRoute } from "nuxt/app";
import {
  GET_PENDING_CHANNEL_OWNERS_BY_CHANNEL,
  GET_CHANNEL_OWNERS_BY_CHANNEL,
} from "@/graphQLData/mod/queries";
import ErrorBanner from "@/components/ErrorBanner.vue";

const route = useRoute();

const newOwnerUsername = ref("");

const forumId = computed(() => {
  if (typeof route.params.forumId === "string") {
    return route.params.forumId;
  }
  return "";
});

const {
  loading: inviteOwnerLoading,
  error: inviteOwnerError,
  mutate: inviteOwner,
  onDone: inviteOwnerDone,
} = useMutation(INVITE_FORUM_OWNER, {
  update: (cache, { data }) => {
    // update the result of GET_PENDING_CHANNEL_OWNERS_BY_CHANNEL
    // to add the newly invited user

    const existingData: any = cache.readQuery({
      query: GET_PENDING_CHANNEL_OWNERS_BY_CHANNEL,
      variables: {
        channelUniqueName: forumId.value,
      },
    });

    const existingInvites =
      existingData?.channels[0]?.PendingOwnerInvites ?? [];

    cache.writeQuery({
      query: GET_PENDING_CHANNEL_OWNERS_BY_CHANNEL,
      variables: {
        channelUniqueName: forumId.value,
      },
      data: {
        channels: [
          {
            PendingOwnerInvites: [
              ...existingInvites,
              {
                username: newOwnerUsername.value,
              },
            ],
          },
        ],
      },
    });
  },
});

const {
  mutate: cancelInviteOwner,
  loading: cancelInviteOwnerLoading,
  error: cancelInviteOwnerError,
  onDone: cancelInviteOwnerDone,
} = useMutation(CANCEL_INVITE_FORUM_OWNER, {
  update: (cache) => {
    // update the result of GET_PENDING_CHANNEL_OWNERS_BY_CHANNEL
    // to add the newly invited user

    const existingData: any = cache.readQuery({
      query: GET_PENDING_CHANNEL_OWNERS_BY_CHANNEL,
      variables: {
        channelUniqueName: forumId.value,
      },
    });

    const existingInvites =
      existingData?.channels[0]?.PendingOwnerInvites ?? [];

    cache.writeQuery({
      query: GET_PENDING_CHANNEL_OWNERS_BY_CHANNEL,
      variables: {
        channelUniqueName: forumId.value,
      },
      data: {
        channels: [
          {
            PendingOwnerInvites: [
              ...existingInvites.filter(
                (invite: any) => invite.username !== newOwnerUsername.value
              ),
            ],
          },
        ],
      },
    });
  },
});

const {
  mutate: removeForumOwner,
  loading: removeForumOwnerLoading,
  onDone: removeForumOwnerDone,
  error: removeForumOwnerError,
} = useMutation(REMOVE_FORUM_OWNER, {
  update: (cache) => {
    // update the result of GET_CHANNEL_OWNERS_BY_CHANNEL
    // to remove the removed user

    const existingData: any = cache.readQuery({
      query: GET_CHANNEL_OWNERS_BY_CHANNEL,
      variables: {
        channelUniqueName: forumId.value,
      },
    });

    const existingOwners = existingData?.channels[0]?.Admins ?? [];

    cache.writeQuery({
      query: GET_CHANNEL_OWNERS_BY_CHANNEL,
      variables: {
        channelUniqueName: forumId.value,
      },
      data: {
        channels: [
          {
            Admins: [
              ...existingOwners.filter(
                (owner: any) => owner.username !== newOwnerUsername.value
              ),
            ],
          },
        ],
      },
    });
  },
});

inviteOwnerDone(() => {
  newOwnerUsername.value = "";
});

removeForumOwnerDone(() => {
  showRemoveChannelOwnerModal.value = false;
});

const showCancelInviteModal = ref(false);
const showRemoveChannelOwnerModal = ref(false);

cancelInviteOwnerDone(() => {
  showCancelInviteModal.value = false;
});

const inviteeToRemove = ref("");
const forumOwnerToRemove = ref("");

const clickCancelInvite = (inviteeUsername: string) => {
  inviteeToRemove.value = inviteeUsername;
  showCancelInviteModal.value = true;
};

const clickRemoveOwner = (ownerUsername: string) => {
  forumOwnerToRemove.value = ownerUsername;
  showRemoveChannelOwnerModal.value = true;
};
</script>

<template>
  <div class="flex-col space-y-4 dark:text-white">
    <div class="mb-6">
      <h1 class="text-xl font-bold mb-2">Suspended Users</h1>
      <p class="text-gray-600 text-sm dark:text-gray-400">
        {{ `These users have been suspended from ${forumId}.` }}
      </p>
      <ul
        class="text-gray-600 text-sm dark:text-gray-400 list-disc ml-4 list-outside"
      >
        <li>
          To un-suspend a user, click Related Issue and follow the provided
          instructions.
        </li>
        <li>
          To suspend a user, go to the rule-breaking comment or post and click
          Suspend Mod in the action menu.
        </li>
      </ul>
    </div>
    <FormRow section-title="Suspended User List">
      <template #content>
        <ForumOwnerList @click-remove-owner="clickRemoveOwner" />
      </template>
    </FormRow>
  </div>
</template>
