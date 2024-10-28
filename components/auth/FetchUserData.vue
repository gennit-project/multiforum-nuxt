<script setup lang="ts">
import { ref } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_EMAIL } from "@/graphQLData/email/queries";
import { setUsername, setModProfileName } from "@/cache";
import type { User } from "@/__generated__/graphql";
import CreateUsernamePage from "./CreateUsernamePage.vue";

const { user, isAuthenticated } = useAuth0();
const emailNotInSystem = ref(false);

const { onResult: onEmailResult } = useQuery(GET_EMAIL, {
  emailAddress: user.value?.email,
});

onEmailResult((result: any) => {
  if (!import.meta.client) return;
  let user: User | null = null;
  const emailData = result.data?.emails[0];

  user = emailData?.User;
  if (!user) {
    emailNotInSystem.value = true;
  } else {
    setUsername(user.username);
    setModProfileName(user.ModerationProfile?.displayName || "");
    emailNotInSystem.value = false;
  }
});
</script>

<template>
  <div v-if="isAuthenticated">
    <CreateUsernamePage v-if="emailNotInSystem" @email-and-user-created="emailNotInSystem = false" />
  </div>
</template>
