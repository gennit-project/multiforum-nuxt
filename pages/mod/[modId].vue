<script lang="ts" setup>
import { computed } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_MOD } from "@/graphQLData/mod/queries";
import ModProfileSidebar from "@/components/mod/ModProfileSidebar.vue";
import { useRoute, useRouter } from "nuxt/app";
import ModProfileTabs from "../../components/mod/ModProfileTabs.vue";

const route = useRoute();
const router = useRouter();
const modId = computed(() => {
  if (typeof route.params.modId === "string") {
    return route.params.modId;
  }
  return "";
});

const { result, error } = useQuery(
  GET_MOD,
  {
    displayName: modId.value,
  },
  {
    fetchPolicy: "cache-first",
  }
);

const mod = computed(() => {
  if (result.value && result.value.moderationProfiles.length > 0) {
    return result.value.moderationProfiles[0];
  }
  return null;
});

if (modId.value) {
  const modProfileBasePathName = `mod-modId`;
  if (route.name === modProfileBasePathName) {
    router.push(`/mod/${modId.value}/comments`);
  }
}
</script>

<template>
  <NuxtLayout>
    <div class="max-w-screen-2xl w-full px-2 dark:bg-black">
      <ModProfileSidebar :is-admin="false" />
      <div class="flex-1 min-w-0">
        <ModProfileTabs
          v-if="mod"
          :show-counts="true"
          :mod="mod"
          class="block border-b border-gray-200 dark:border-gray-600"
          :route="route"
        />
      </div>
      <ErrorBanner v-if="error" :error="error" />
      <NuxtPage />
    </div>
  </NuxtLayout>
</template>

<style lang="scss">
.user-background {
  background-color: #4474c0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 152 152'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='temple' fill='%23efefef' fill-opacity='0.4'%3E%3Cpath d='M152 150v2H0v-2h28v-8H8v-20H0v-2h8V80h42v20h20v42H30v8h90v-8H80v-42h20V80h42v40h8V30h-8v40h-42V50H80V8h40V0h2v8h20v20h8V0h2v150zm-2 0v-28h-8v20h-20v8h28zM82 30v18h18V30H82zm20 18h20v20h18V30h-20V10H82v18h20v20zm0 2v18h18V50h-18zm20-22h18V10h-18v18zm-54 92v-18H50v18h18zm-20-18H28V82H10v38h20v20h38v-18H48v-20zm0-2V82H30v18h18zm-20 22H10v18h18v-18zm54 0v18h38v-20h20V82h-18v20h-20v20H82zm18-20H82v18h18v-18zm2-2h18V82h-18v18zm20 40v-18h18v18h-18zM30 0h-2v8H8v20H0v2h8v40h42V50h20V8H30V0zm20 48h18V30H50v18zm18-20H48v20H28v20H10V30h20V10h38v18zM30 50h18v18H30V50zm-2-40H10v18h18V10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
</style>
