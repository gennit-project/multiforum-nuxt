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
    <main
      v-if="serverConfig"
      class="flex w-full flex-1 justify-center"
    >
      <article class="w-full max-w-screen-2xl rounded-lg focus:outline-none dark:bg-black">
        <ServerTabs
          class="mb-2 w-full border-b border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-800"
          :desktop="false"
          :route="route"
          :server-config="serverConfig"
          :show-counts="true"
          :vertical="false"
        />
        <div class="relative w-full">
          <div class="flex flex-col divide-x dark:divide-gray-500 md:flex-row">
            <div class="min-w-0 flex-1 bg-white p-4 dark:bg-gray-800 md:p-6">
              <div class="max-w-full">
                <NuxtPage />
              </div>
            </div>
            <aside
              class="w-full flex-shrink-0 bg-white dark:bg-gray-800 md:sticky md:top-0 md:max-h-screen md:w-1/4 md:overflow-y-auto"
            >
              <ServerSidebar
                :key="serverConfig.rules"
                class="p-6 pt-8"
                :server-config="serverConfig"
              />
            </aside>
          </div>
        </div>
      </article>
    </main>
    <div
      v-else
      class="mx-4 my-6 flex-1 flex-col items-center"
    >
      <h1 class="text-2xl font-bold">Server not found</h1>
      <p class="text-gray-500 dark:text-gray-400">Could not find the server configuration.</p>
    </div>
  </NuxtLayout>
</template>
