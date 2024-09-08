<script lang="ts">
import { defineComponent, computed } from "vue";
import { useRoute } from "vue-router";
import { useQuery } from "@vue/apollo-composable";
import { GET_MOD } from "@/graphQLData/mod/queries";
import UsernameLabel from "@/components/UsernameLabel.vue";
import { relativeTime } from "@/utils";

export default defineComponent({
  components: {
    ErrorBanner,
    UsernameLabel
  },
  setup() {
    const route = useRoute();

    const modId = computed(() => {
      if (typeof route.params.modId === "string") {
        return route.params.modId;
      }
      return "";
    });

    const { result, loading, error } = useQuery(GET_MOD, () => ({
      displayName: modId.value,
    }));

    const mod = computed(() => {
      if (loading.value || error.value) {
        return null;
      }
      if (result.value && result.value.moderationProfiles.length > 0) {
        return result.value.moderationProfiles[0];
      }
      return null;
    });

    return {
      error,
      loading,
      displayName: result.value ? result.value.displayName : "",
      mod,
      modId,
      relativeTime,
      route,
      tabs: [
        { name: "Authored Comments", href: "comments", current: true },
        { name: "Authored Issues", href: "discussions", current: false },
        // { name: "Authored Reports", href: "reports", current: false },
      ],
    };
  },
});
</script>

<template>
  <div class="flex-1">
    <div v-if="loading">
      Loading...
    </div>
    <ErrorBanner
      v-else-if="error"
      :text="error.message"
      :error="error"
    />
    <div v-else-if="!mod">
      <p class="m-4">
        Mod profile not found.
      </p>
    </div>
    <article v-else>
      <div>
        <div>
          <div
            class="h-32 w-full object-cover lg:h-48 mod-background"
            alt="background pattern"
          />
        </div>
        <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div class="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
            <div class="flex">
              <h2
                v-if="displayName"
                class="h-24 w-24 ring-4 ring-white sm:h-32 sm:w-32"
              >{displayName}</h2>
            </div>
            <div
              class="mt-6 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-end sm:space-x-6 sm:pb-1"
            >
              <div class="mt-6 min-w-0 flex-1 sm:hidden 2xl:block">
                <h1 class="truncate text-2xl mb-2 lg:mt-10 font-bold text-gray-900">
                  {{ modId }}
                </h1>
                {{ `Created ${relativeTime(mod.createdAt)}` }}
              </div>
            </div>
          </div>
          <div class="mt-6 hidden min-w-0 flex-1 sm:block 2xl:hidden">
            <h1 class="truncate text-2xl mb-2 lg:mt-10 font-bold text-gray-900 flex justify-content">
              {{ modId }}<UsernameLabel :text="'MOD'" />
            </h1>
            {{ `Created ${relativeTime(mod.createdAt)}` }}
          </div>
          <ul class="m-4 list-disc">
            <li>
              {{ `${mod.AuthoredCommentsAggregate.count} authored comments` }}
            </li>
            <li>
              {{
                `${mod.AuthoredIssuesAggregate.count} authored issues`
              }}
            </li>
          </ul>
        </div>
      </div>

      <!-- <div class="mt-6 sm:mt-2 2xl:mt-5  ">
        <div class="border-b border-gray-200 bg-gray-100">
          <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <nav
              class="-mb-px flex space-x-8"
              aria-label="Tabs"
            >
              <a
                v-for="tab in tabs"
                :key="tab.name"
                :href="`${route.path}/${tab.href}`"
                :class="[
                  tab.current
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                ]"
                :aria-current="tab.current ? 'page' : undefined"
              >{{ tab.name }}</a>
            </nav>
          </div>
        </div>
        <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-12">
          <NuxtPage />
        </div>
      </div> -->
    </article>
  </div>
</template>
<style>
.mod-background {
    background-color: #34478b;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cg fill='%23b5baf6' fill-opacity='0.4'%3E%3Cpath fill-rule='evenodd' d='M5 3.59L1.46.05.05 1.46 3.59 5 .05 8.54l1.41 1.41L5 6.41l3.54 3.54 1.41-1.41L6.41 5l3.54-3.54L8.54.05 5 3.59zM17 2h24v2H17V2zm0 4h24v2H17V6zM2 17h2v24H2V17zm4 0h2v24H6V17z'/%3E%3C/g%3E%3C/svg%3E");
}
</style>