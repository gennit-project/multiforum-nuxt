<script setup lang="ts">
import { computed, ref } from "vue";
import {
  PENDING_FORUM_OWNER_INVITE_EXISTS,
  PENDING_FORUM_MOD_INVITE_EXISTS,
  ACCEPT_FORUM_OWNER_INVITE,
} from "@/graphQLData/mod/queries";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { usernameVar } from "@/cache";
import { useRoute } from "nuxt/app";
import PrimaryButton from "@/components/PrimaryButton.vue";
import ErrorBanner from "../ErrorBanner.vue";

const route = useRoute();

const channelId = computed(() => {
  return typeof route.params.forumId === "string" ? route.params.forumId : "";
});

const { result: pendingOwnerInviteResult } = useQuery(
  PENDING_FORUM_OWNER_INVITE_EXISTS,
  {
    username: usernameVar.value,
    channelId: channelId.value,
  }
);

const {
    result: pendingModInviteResult,
} = useQuery(PENDING_FORUM_MOD_INVITE_EXISTS, {
    username: usernameVar.value,
    channelId: channelId.value,
});


const {
  mutate: acceptForumOwnerInvite,
  loading: acceptForumOwnerInviteLoading,
  onDone: onDoneAcceptForumOwnerInvite,
  error: acceptForumOwnerInviteError,
} = useMutation(ACCEPT_FORUM_OWNER_INVITE);

const pendingOwnerInviteExists = computed(() => {
  console.log("pendingInviteResult", pendingOwnerInviteResult.value);
  const channelData = pendingOwnerInviteResult.value?.channels[0];
  if (!channelData) {
    return false;
  }
  const pendingInvite = channelData?.PendingOwnerInvites[0];
  if (usernameVar.value === pendingInvite?.username) {
    return true;
  }
  return false;
});

const pendingModInviteExists = computed(() => {
  console.log("pendingInviteResult", pendingModInviteResult.value);
  const channelData = pendingModInviteResult.value?.channels[0];
  if (!channelData) {
    return false;
  }
  const pendingInvite = channelData?.PendingModInvites[0];
  if (usernameVar.value === pendingInvite?.username) {
    return true;
  }
  return false;
});

const handleAcceptForumOwnerInvite = () => {
  acceptForumOwnerInvite({
    channelId: channelId.value,
  });
};

const showSuccess = ref(false);

onDoneAcceptForumOwnerInvite(() => {
  showSuccess.value = true;
});
</script>
<template>
  <div class="flex flex-col items-center justify-center dark:text-white">
    <h1 class="text-2xl">Accept Invite</h1>
    <div
      v-if="pendingOwnerInviteExists"
      class="flex flex-col items-center justify-center"
    >
      <p class="text-lg">You have been invited to be an owner of this forum.</p>
      <PrimaryButton
        v-if="!showSuccess"
        class="mt-4"
        :label="'Accept Invite'"
        :loading="acceptForumOwnerInviteLoading"
        @click="handleAcceptForumOwnerInvite"
      />
      <p v-else class="mt-4">Invite accepted!</p>
      <ErrorBanner
        v-if="acceptForumOwnerInviteError"
        :text="acceptForumOwnerInviteError.message"
      />
    </div>

    <div
      v-else-if="pendingModInviteExists"
      class="flex flex-col items-center justify-center"
    >
      <p class="text-lg">
        You have been invited to be a moderator of this forum.
      </p>
      <PrimaryButton
        class="mt-4"
        :label="'Accept Invite'"
        @click="console.log('accept invite')"
      />
    </div>
    <p v-else>You have no pending invites for this forum.</p>
  </div>
</template>
