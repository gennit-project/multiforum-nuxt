<script lang="ts" setup>
import PendingForumModList from '@/components/channel/form/PendingForumModList.vue';
import ModList from '@/components/channel/form/ModList.vue';
import { ref, computed } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { InviteForumModDocument as INVITE_FORUM_MOD, CancelInviteForumModDocument as CANCEL_INVITE_FORUM_MOD, RemoveForumModDocument as REMOVE_FORUM_MOD, GetPendingChannelModsByChannelDocument as GET_PENDING_CHANNEL_MODS_BY_CHANNEL, GetModsByChannelSource31c1e8fd16Document as GET_MODS_BY_CHANNEL  } from '@/__generated__/operations';
import { useRoute } from 'nuxt/app';
import ErrorBanner from '@/components/ErrorBanner.vue';

const route = useRoute();

const newModUsername = ref('');

const forumId = computed(() => {
  if (typeof route.params.forumId === 'string') {
    return route.params.forumId;
  }
  return '';
});

const {
  loading: inviteModLoading,
  error: inviteModError,
  mutate: inviteMod,
  onDone: inviteModDone,
} = useMutation(INVITE_FORUM_MOD, () => ({
  // The boolean mutation response cannot populate a selected user/mod row.
  // Refetch the captured forum instead of fabricating an incomplete cache entry.
  refetchQueries: [{ query: GET_PENDING_CHANNEL_MODS_BY_CHANNEL, variables: { channelUniqueName: forumId.value } }],
  awaitRefetchQueries: true,
}));

const {
  mutate: cancelInviteMod,
  loading: cancelInviteModLoading,
  error: cancelInviteModError,
  onDone: cancelInviteModDone,
} = useMutation(CANCEL_INVITE_FORUM_MOD, () => ({
  // The boolean mutation response cannot populate a selected user/mod row.
  // Refetch the captured forum instead of fabricating an incomplete cache entry.
  refetchQueries: [{ query: GET_PENDING_CHANNEL_MODS_BY_CHANNEL, variables: { channelUniqueName: forumId.value } }],
  awaitRefetchQueries: true,
}));

const {
  mutate: removeForumMod,
  loading: removeForumModLoading,
  onDone: removeForumModDone,
  error: removeForumModError,
} = useMutation(REMOVE_FORUM_MOD, () => ({
  // The boolean mutation response cannot populate a selected user/mod row.
  // Refetch the captured forum instead of fabricating an incomplete cache entry.
  refetchQueries: [{ query: GET_MODS_BY_CHANNEL, variables: { channelUniqueName: forumId.value } }],
  awaitRefetchQueries: true,
}));

inviteModDone(() => {
  newModUsername.value = '';
});

removeForumModDone(() => {
  showRemoveChannelModModal.value = false;
});

const showCancelInviteModal = ref(false);
const showRemoveChannelModModal = ref(false);

cancelInviteModDone(() => {
  showCancelInviteModal.value = false;
});

const inviteeToRemove = ref('');
const forumModToRemove = ref('');

const clickCancelInvite = (inviteeUsername: string) => {
  inviteeToRemove.value = inviteeUsername;
  showCancelInviteModal.value = true;
};

const clickRemoveMod = (modProfileName: string) => {
  forumModToRemove.value = modProfileName;
  showRemoveChannelModModal.value = true;
};
</script>

<template>
  <div class="flex-col space-y-4 dark:text-white">
    <FormRow section-title="Invite a New Mod">
      <template #content>
        <div class="flex w-full items-center gap-2">
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
            @click="
              () =>
                inviteMod({
                  inviteeUsername: newModUsername,
                  channelUniqueName: forumId,
                })
            "
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
            modProfileName: forumModToRemove,
            channelUniqueName: forumId,
          })
      "
    />
  </div>
</template>
