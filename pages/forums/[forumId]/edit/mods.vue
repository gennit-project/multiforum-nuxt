<script lang="ts" setup>
import PendingForumModList from "@/components/channel/form/PendingForumModList.vue";
import ModList from "@/components/channel/form/ModList.vue";
import { ref, computed } from "vue";
import { useMutation } from "@vue/apollo-composable";
import {
  INVITE_FORUM_MOD,
  CANCEL_INVITE_FORUM_MOD,
  REMOVE_FORUM_MOD,
} from "@/graphQLData/mod/mutations";
import { useRoute } from "nuxt/app";
import {
  GET_PENDING_CHANNEL_MODS_BY_CHANNEL,
  GET_MODS_BY_CHANNEL,
} from "@/graphQLData/mod/queries";
import ErrorBanner from "@/components/ErrorBanner.vue";

const route = useRoute();

const newModUsername = ref("");

const forumId = computed(() => {
  if (typeof route.params.forumId === "string") {
    return route.params.forumId;
  }
  return "";
});

const {
  loading: inviteModLoading,
  error: inviteModError,
  mutate: inviteMod,
  onDone: inviteModDone,
} = useMutation(INVITE_FORUM_MOD, {
  update: (cache) => {
    // update the result of GET_PENDING_CHANNEL_MODS_BY_CHANNEL
    // to add the newly invited user

    const existingData: any = cache.readQuery({
      query: GET_PENDING_CHANNEL_MODS_BY_CHANNEL,
      variables: {
        channelUniqueName: forumId.value,
      },
    });

    const existingInvites =
      existingData?.channels[0]?.PendingModInvites ?? [];

    cache.writeQuery({
      query: GET_PENDING_CHANNEL_MODS_BY_CHANNEL,
      variables: {
        channelUniqueName: forumId.value,
      },
      data: {
        channels: [
          {
            PendingModInvites: [
              ...existingInvites,
              {
                displayName: newModUsername.value,
              },
            ],
          },
        ],
      },
    });
  },
});

const {
  mutate: cancelInviteMod,
  loading: cancelInviteModLoading,
  error: cancelInviteModError,
  onDone: cancelInviteModDone,
} = useMutation(CANCEL_INVITE_FORUM_MOD, {
  update: (cache) => {
    // update the result of GET_PENDING_CHANNEL_MODS_BY_CHANNEL
    // to add the newly invited mod

    const existingData: any = cache.readQuery({
      query: GET_PENDING_CHANNEL_MODS_BY_CHANNEL,
      variables: {
        channelUniqueName: forumId.value,
      },
    });

    const existingInvites =
      existingData?.channels[0]?.PendingModInvites ?? [];

    cache.writeQuery({
      query: GET_PENDING_CHANNEL_MODS_BY_CHANNEL,
      variables: {
        channelUniqueName: forumId.value,
      },
      data: {
        channels: [
          {
            PendingModInvites: [
              ...existingInvites.filter(
                (invite: any) => invite.username !== newModUsername.value
              ),
            ],
          },
        ],
      },
    });
  },
});

<<<<<<< HEAD
  const {
    mutate: removeForumMod,
    loading: removeForumModLoading,
    onDone: removeForumModDone,
    error: removeForumModError,
  } = useMutation(REMOVE_FORUM_MOD, {
    update: (cache) => {
=======
const { 
  mutate: removeForumMod, 
  loading: removeForumModLoading,
  onDone: removeForumModDone,
  error: removeForumModError,
} =
  useMutation(REMOVE_FORUM_MOD, {
    update: (cache, { data }) => {
>>>>>>> parent of 666ae3d (Use automated formatting tools)
      // update the result of GET_MODS_BY_CHANNEL
      // to remove the removed user

      const existingData: any = cache.readQuery({
        query: GET_MODS_BY_CHANNEL ,
        variables: {
          channelUniqueName: forumId.value,
        },
      });

      const existingMods = existingData?.channels[0]?.Admins ?? [];

      cache.writeQuery({
        query: GET_MODS_BY_CHANNEL,
        variables: {
          channelUniqueName: forumId.value,
        },
        data: {
          channels: [
            {
              Admins: [
                ...existingMods.filter(
                  (mod: any) => mod.username !== newModUsername.value
                ),
              ],
            },
          ],
        },
      });
    },
  });

inviteModDone(() => {
  newModUsername.value = "";
});

removeForumModDone(() => {
  showRemoveChannelModModal.value = false;
});

const showCancelInviteModal = ref(false);
const showRemoveChannelModModal = ref(false);

cancelInviteModDone(() => {
  showCancelInviteModal.value = false;
});

const inviteeToRemove = ref("");
const forumModToRemove = ref("");

const clickCancelInvite = (inviteeUsername: string) => {
  inviteeToRemove.value = inviteeUsername;
  showCancelInviteModal.value = true;
};

const clickRemoveMod = (modUsername: string) => {
  forumModToRemove.value = modUsername;
  showRemoveChannelModModal.value = true;
};
</script>

<template>
  <div class="flex-col space-y-4 dark:text-white">
    <FormRow section-title="Invite a New Mod">
      <template #content>
        <div class="w-full flex items-center gap-2">
          <div class="w-full flex-1 items-center">
            <TextInput
              :test-id="'new-mod-input'"
              :placeholder="'Enter the username of the new mod'"
              :value="newModUsername"
              :full-width="true"
              @update="newModUsername = $event"
            />
          </div>

          <PrimaryButton
            :label="'Invite'"
            :loading="inviteModLoading"
            :disabled="!newModUsername"
            @click="() => inviteMod({
              inviteeUsername: newModUsername,
              channelUniqueName: forumId,
            })"
          />
        </div>
        <ErrorBanner v-if="inviteModError" :text="inviteModError.message" />
        <ErrorBanner
          v-if="cancelInviteModError"
          :text="cancelInviteModError.message"
        />
      </template>
    </FormRow>
    <FormRow section-title="Pending Invites">
      <template #content>
        <PendingForumModList @click-cancel-invite="clickCancelInvite" />
      </template>
    </FormRow>
    <FormRow section-title="Mod List">
      <template #content>
        <ModList @click-remove-mod="clickRemoveMod" />
      </template>
    </FormRow>
    <WarningModal
      data-testid="confirm-cancel-invite-modal"
      title="Confirm Cancel Invite"
      :body="`Are you sure you want to cancel the invite to ${inviteeToRemove}?`"
      :open="showCancelInviteModal"
      :loading="cancelInviteModLoading"
      :primary-button-text="'Yes, Cancel Invite'"
      :error="cancelInviteModError"
      @close="showCancelInviteModal = false"
      @primary-button-click="
        () =>
          cancelInviteMod({
            inviteeUsername: inviteeToRemove,
            channelUniqueName: forumId,
          })
      "
    />
    <WarningModal
      data-testid="confirm-cancel-invite-modal"
      title="Confirm Remove Forum Mod"
      :body="`Are you sure you want to remove ${forumModToRemove} as a forum mod?`"
      :open="showRemoveChannelModModal"
      :loading="removeForumModLoading"
      :primary-button-text="'Yes, Remove Mod'"
      :error="removeForumModError"
      @close="showRemoveChannelModModal = false"
      @primary-button-click="
        () =>
          removeForumMod({
            username: forumModToRemove,
            channelUniqueName: forumId,
          })
      "
    />
  </div>
</template>
