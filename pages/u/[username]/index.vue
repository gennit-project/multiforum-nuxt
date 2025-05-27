<script lang="ts" setup>
// redirect to /comments
import { GET_USER } from "@/graphQLData/user/queries";
import { useRoute, useRouter } from "nuxt/app";
import UserProfileTabs from "@/components/user/UserProfileTabs.vue";
import { useQuery } from "@vue/apollo-composable";
import { computed } from "vue";

const router = useRouter();

const route = useRoute();
const username = computed(() => {
  return typeof route.params.username === "string" ? route.params.username : "";
});
router.push(`/u/${username.value}/comments`);

const {
  result: userResult,
  loading: userLoading,
  error: userError,
} = useQuery(
  GET_USER,
  {
    username: username.value,
  },
  {
    enabled: !!username.value,
    fetchPolicy: "network-only",
  }
);

// Compute the user data
const user = computed(() => {
  if (userLoading.value || userError.value) return null;
  if (userResult.value && userResult.value.users.length > 0) {
    return userResult.value.users[0];
  }
  return null;
});
</script>

<template>
  <div class="w-full md:w-3/4 pt-6 rounded-lg bg-gray-100 dark:bg-gray-900">
    <UserProfileTabs
      v-if="user"
<<<<<<< HEAD
      class="block border-b border-gray-300 dark:border-gray-600"
=======
      :show-counts="true"
      :vertical="false"
      :user="user"
      class="block border-b border-gray-200 dark:border-gray-600"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
      :route="route"
    />
    <div v-else>
      Loading...
    </div>
    <NuxtPage />
  </div>
</template>
