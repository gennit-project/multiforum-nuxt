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
    update: (cache) => {
      // update the result of GET_PENDING_CHANNEL_OWNERS_BY_CHANNEL
      // to add the newly invited user

      const existingData: any = cache.readQuery({
        query: GET_PENDING_CHANNEL_OWNERS_BY_CHANNEL,
        variables: {
          channelUniqueName: forumId.value,
        },
      });

      const existingInvites = existingData?.channels[0]?.PendingOwnerInvites ?? [];

      cache.writeQuery({
        query: GET_PENDING_CHANNEL_OWNERS_BY_CHANNEL,
        variables: {
          channelUniqueName: forumId.value,
        },
        data: {
          channels: [
            {
              ...existingData.channels[0],
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

      const existingInvites = existingData?.channels[0]?.PendingOwnerInvites ?? [];

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
                ...existingOwners.filter((owner: any) => owner.username !== newOwnerUsername.value),
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
    <FormRow section-title="Invite a New Admin">
      <template #content>
        <div class="flex w-full items-center gap-2">
          <div class="w-full">
            <TextInput
              :full-width="true"
              :placeholder="'Enter the username of the new owner'"
              :test-id="'new-owner-input'"
              :value="newOwnerUsername"
              @update="newOwnerUsername = $event"
            />
          </div>

          <PrimaryButton
            :disabled="newOwnerUsername === ''"
            :label="'Invite'"
            :loading="inviteOwnerLoading"
            @click="
              () =>
                inviteOwner({
                  inviteeUsername: newOwnerUsername,
                  channelUniqueName: forumId,
                })
            "
          />
        </div>
        <ErrorBanner
          v-if="inviteOwnerError"
          :text="inviteOwnerError.message"
        />
        <ErrorBanner
          v-if="cancelInviteOwnerError"
          :text="cancelInviteOwnerError.message"
        />
      </template>
    </FormRow>
    <FormRow section-title="Pending Invites">
      <template #content>
        <PendingForumOwnerList @click-cancel-invite="clickCancelInvite" />
      </template>
    </FormRow>
    <FormRow section-title="Admin List">
      <template #content>
        <ForumOwnerList @click-remove-owner="clickRemoveOwner" />
      </template>
    </FormRow>
    <WarningModal
      :body="`Are you sure you want to cancel the invite to ${inviteeToRemove}?`"
      data-testid="confirm-cancel-invite-modal"
      :error="cancelInviteOwnerError"
      :loading="cancelInviteOwnerLoading"
      :open="showCancelInviteModal"
      :primary-button-text="'Yes, Cancel Invite'"
      title="Confirm Cancel Invite"
      @close="showCancelInviteModal = false"
      @primary-button-click="
        () =>
          cancelInviteOwner({
            inviteeUsername: inviteeToRemove,
            channelUniqueName: forumId,
          })
      "
    />
    <WarningModal
      :body="`Are you sure you want to remove ${forumOwnerToRemove} as a forum owner?`"
      data-testid="confirm-cancel-invite-modal"
      :error="removeForumOwnerError"
      :loading="removeForumOwnerLoading"
      :open="showRemoveChannelOwnerModal"
      :primary-button-text="'Yes, Remove Admin'"
      title="Confirm Remove Forum Owner"
      @close="showRemoveChannelOwnerModal = false"
      @primary-button-click="
        () =>
          removeForumOwner({
            username: forumOwnerToRemove,
            channelUniqueName: forumId,
          })
      "
    />
  </div>
</template>
