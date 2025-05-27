<script setup lang="ts">
import { computed } from "vue";
import { GET_SUSPENDED_MODS_BY_CHANNEL } from "@/graphQLData/mod/queries";
import { useQuery } from "@vue/apollo-composable";
import { useRoute } from "nuxt/app";
import { DateTime } from "luxon";

const route = useRoute();
const forumId = computed(() => {
  if (typeof route.params.forumId === "string") {
    return route.params.forumId;
  }
  return "";
});

const { result, loading, error } = useQuery(
  GET_SUSPENDED_MODS_BY_CHANNEL,
  () => ({
    channelUniqueName: forumId.value,
  }),
  {
    fetchPolicy: "cache-first",
  }
);
const suspensions = computed(
  () => result.value?.channels[0]?.SuspendedMods ?? []
);
const aggregateCount = computed(
  () => result.value?.channels[0]?.SuspendedModsAggregate?.count ?? 0
);

const humanReadableDate = (dateISO: string): string => {
  return DateTime.fromISO(dateISO).toLocaleString(DateTime.DATETIME_MED);
};
defineEmits(["click-remove-mod"]);
</script>
<template>
  <div class="flex flex-col gap-3 py-3 dark:text-white">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error</div>
    <div
      v-else-if="
        result?.channels?.length === 0 ||
        result.channels[0]?.SuspendedMods?.length === 0
      "
      class="text-sm"
    >
      There are no active mod suspensions.
    </div>

    <div v-if="suspensions && suspensions.length > 0" class="flex-col text-sm">
      <div class="text-sm font-bold">
        {{ `Active Suspensions (${aggregateCount})` }}
      </div>
      <div
        v-for="suspension in suspensions"
        :key="suspension.username"
        class="flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
      >
        <div class="flex-col w-full">
          <div class="flex justify-between gap-2 w-full">
            <nuxt-link
              :to="{
                name: 'mod-modId',
                params: { modId: suspension?.SuspendedMod?.displayName },
              }"
              class="flex items-center dark:text-white"
            >
              <AvatarComponent
                :text="suspension?.SuspendedMod?.displayName"
                class="mr-2 h-6 w-6"
              />
              <span class="text-sm">{{
                `${suspension?.SuspendedMod?.displayName} ${suspension?.username ? `(${suspension?.username})` : ""}`
              }}</span>
            </nuxt-link>
            <nuxt-link
              v-if="suspension.RelatedIssue"
<<<<<<< HEAD
              class="items-center gap-1 rounded border border-orange-500 px-2 py-1 text-orange-500"
=======
              class="rounded border border-blue-500 px-2 py-1 text-blue-500 items-center gap-1"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
              :to="{
                name: 'forums-forumId-issues-issueId',
                params: { issueId: suspension.RelatedIssue?.id },
              }"
            >
              Related Issue
            </nuxt-link>
          </div>

          <div
            v-if="!suspension.suspendedIndefinitely"
            class="text-sm text-gray-500 dark:text-gray-300"
          >
            {{
              `Suspended until ${humanReadableDate(suspension?.suspendedUntil)}`
            }}
          </div>
          <div v-else class="text-sm text-gray-500 dark:text-gray-300">
            {{
              `Suspended indefinitely as of ${humanReadableDate(suspension?.createdAt)}`
            }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
