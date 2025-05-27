<script lang="ts" setup>
import { computed, watchEffect } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_USER } from "@/graphQLData/user/queries";
import UserProfileSidebar from "@/components/user/UserProfileSidebar.vue";
import { useHead, useRoute } from "nuxt/app";
import UserContributionChart from "@/components/charts/UserContributionChart.vue";

const route = useRoute();
const username = computed(() => {
  return typeof route.params.username === "string" ? route.params.username : "";
});

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

const user = computed(() => {
  if (userLoading.value || userError.value) return null;
  if (userResult.value && userResult.value.users.length > 0) {
    return userResult.value.users[0];
  }
  return null;
});

const isAdmin = computed(() => {
  if (user.value) {
    const serverRole = user.value.ServerRoles?.[0];
    return serverRole?.showAdminTag;
  }
  return false;
});

// Add SEO metadata for the user profile
watchEffect(() => {
  if (!user.value) {
    useHead({
      title: username.value ? `${username.value} - Profile` : 'User Not Found',
      description: 'The requested user profile could not be found.'
    });
    return;
  }

  const userName = user.value.displayName || user.value.username;
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const serverName = import.meta.env.VITE_SERVER_DISPLAY_NAME;
  const profilePic = user.value.profilePicURL || '';
  const userBio = user.value.bio || `${userName}'s profile`;
  
  // Calculate metrics for description
  const discussionCount = user.value.discussionCount || 0;
  const commentCount = user.value.commentCount || 0;
  const eventsCount = user.value.eventsCount || 0;
  
  const description = userBio.length > 10 
    ? userBio.substring(0, 160) + (userBio.length > 160 ? '...' : '')
    : `${userName} has posted ${discussionCount} discussions, ${commentCount} comments, and ${eventsCount} events on ${serverName}.`;

  // Set basic SEO meta tags
  useHead({
    title: `${userName} | ${serverName}`,
    description: description,
    image: profilePic,
    type: 'profile'
  });

  // Add structured data for rich results
  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: userName,
          description: description,
          image: profilePic,
          url: `${baseUrl}/u/${user.value.username}`,
          memberOf: {
            '@type': 'Organization',
            name: serverName,
            url: baseUrl
          }
        })
      }
    ]
  });
});
</script>

<template>
  <NuxtLayout>
    <div class="max-w-screen-2xl w-full px-2 dark:bg-black bg-white">
      <div class="flex flex-col lg:flex-row w-full">
        <div class="w-full lg:w-80 lg:shrink-0">
          <UserProfileSidebar :is-admin="isAdmin" />
        </div>
        
        <div class="flex-1 flex-col min-w-0 pt-4">
          <client-only>
            <UserContributionChart />
          </client-only>
          <UserProfileTabs
            v-if="user"
<<<<<<< HEAD
            class="block border-b border-gray-300 dark:border-gray-600"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
            :show-counts="true"
            :vertical="false"
            :user="user"
            class="block border-b border-gray-200 dark:border-gray-600"
          />
          <NuxtPage />
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<style lang="scss">
.user-background {
  background-color: #4474c0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 152 152'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='temple' fill='%23efefef' fill-opacity='0.4'%3E%3Cpath d='M152 150v2H0v-2h28v-8H8v-20H0v-2h8V80h42v20h20v42H30v8h90v-8H80v-42h20V80h42v40h8V30h-8v40h-42V50H80V8h40V0h2v8h20v20h8V0h2v150zm-2 0v-28h-8v20h-20v8h28zM82 30v18h18V30H82zm20 18h20v20h18V30h-20V10H82v18h20v20zm0 2v18h18V50h-18zm20-22h18V10h-18v18zm-54 92v-18H50v18h18zm-20-18H28V82H10v38h20v20h38v-18H48v-20zm0-2V82H30v18h18zm-20 22H10v18h18v-18zm54 0v18h38v-20h20V82h-18v20h-20v20H82zm18-20H82v18h18v-18zm2-2h18V82h-18v18zm20 40v-18h18v18h-18zM30 0h-2v8H8v20H0v2h8v40h42V50h20V8H30V0zm20 48h18V30H50v18zm18-20H48v20H28v20H10V30h20V10h38v18zM30 50h18v18H30V50zm-2-40H10v18h18V10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
</style>
