<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_EMAIL } from "@/graphQLData/email/queries";
import { setUsername, usernameVar, setModProfileName } from "@/cache";
import CreateUsernameForm from "@/components/auth/CreateUsernameForm.vue";

const { user } = useAuth0();
// Start with a loading state to prevent flashing
const emailNotInSystem = ref(false);
const initialCheckComplete = ref(false);

// Only check email if we're on the client side
if (import.meta.client) {
  const { onResult: onEmailResult, loading } = useQuery(GET_EMAIL, {
    emailAddress: user.value?.email,
  });

  onEmailResult((result: any) => {
    const emailData = result.data?.emails[0];
    if (emailData?.User) {
      const user = emailData.User;
      setUsername(user.username);
      setModProfileName(user.ModerationProfile?.displayName || "");
      emailNotInSystem.value = false;
    } else {
      emailNotInSystem.value = true;
    }
    initialCheckComplete.value = true;
  });

  // If query doesn't return in a reasonable time, mark it as completed
  // to allow the form to show for genuine new users
  onMounted(() => {
    setTimeout(() => {
      initialCheckComplete.value = true;
    }, 1000);
  });
}
</script>

<template>
  <client-only>
    <CreateUsernameForm
      v-if="user?.email && !usernameVar && emailNotInSystem && initialCheckComplete"
      :email="user.email"
      @email-and-user-created="emailNotInSystem = false"
    />
  </client-only>
</template>
