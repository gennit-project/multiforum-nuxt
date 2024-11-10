<script setup lang="ts">
import { ref,  } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_EMAIL } from "@/graphQLData/email/queries";
import { setUsername, usernameVar, setModProfileName } from "@/cache";
import CreateUsernameForm from "@/components/auth/CreateUsernameForm.vue";

const { user } = useAuth0();
const emailNotInSystem = ref(true);

const { onResult: onEmailResult } = useQuery(GET_EMAIL, {
  emailAddress: user.value?.email,
});

onEmailResult((result: any) => {
  if (!import.meta.client) return;

  const emailData = result.data?.emails[0];
  if (emailData?.User) {
    const user = emailData.User;
    setUsername(user.username);
    setModProfileName(user.ModerationProfile?.displayName || "");
    emailNotInSystem.value = false;
  } else {
    emailNotInSystem.value = true;
  }
});
</script>

<template>
  <CreateUsernameForm
    v-if="user?.email && !usernameVar && emailNotInSystem"
    :email="user.email"
    @email-and-user-created="emailNotInSystem = false"
  />
</template>
