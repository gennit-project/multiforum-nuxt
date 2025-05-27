<script lang="ts" setup>
import { useQuery } from "@vue/apollo-composable";
import { computed } from "vue";
import { useRoute } from "nuxt/app";
import { GET_SERVER_CONFIG } from "@/graphQLData/admin/queries";
import { config } from "@/config";
import ServerSidebar from "@/components/admin/ServerSidebar.vue";
import ServerTabs from "@/components/admin/ServerTabs.vue";

const route = useRoute();
const { result: getServerResult, error: getServerError } = useQuery(
  GET_SERVER_CONFIG,
  {
    serverName: config.serverName,
  },
  {
    fetchPolicy: "cache-first",
  }
);

const serverConfig = computed(() => {
  if (getServerError.value || !getServerResult.value?.serverConfigs) {
    return null;
  }
  return getServerResult.value?.serverConfigs[0] || null;
});

</script>

<template>
  <NuxtLayout>
    <main v-if="serverConfig" class="flex-1 flex justify-center w-full">
     
      <article
        class="w-full max-w-screen-2xl rounded-lg dark:bg-black focus:outline-none"
      >
        <ServerTabs
<<<<<<< HEAD
          class="mb-2 w-full border-b border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-800"
          :desktop="false"
=======
          class="mb-2 w-full border-b border-gray-200 bg-white px-3 dark:border-gray-600 dark:bg-gray-800"
          :vertical="false"
          :show-counts="true"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
          :route="route"
          :server-config="serverConfig"
          :desktop="false"
        />
        <div class="relative w-full">
          <div class="flex flex-col md:flex-row divide-x dark:divide-gray-500">
            <div class="flex-1 min-w-0 p-4 md:p-6 bg-white dark:bg-gray-800">
              <div class="max-w-full">
                <NuxtPage />
              </div>
            </div>
            <aside
              class="w-full md:w-1/4 flex-shrink-0 bg-white dark:bg-gray-800 md:sticky md:top-0 md:overflow-y-auto md:max-h-screen"
            >
              <ServerSidebar
                :key="serverConfig.rules"
                :server-config="serverConfig"
                class="p-6 pt-8"
              />
            </aside>
          </div>
        </div>
      </article>
    </main>
    <div v-else class="flex-1 flex-col my-6 mx-4 items-center">
        <h1 class="text-2xl font-bold">Server not found</h1>
        <p class="text-gray-500 dark:text-gray-400">
          Could not find the server configuration.
        </p>
    </div>
  </NuxtLayout>
</template>
