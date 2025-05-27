<script setup lang="ts">
import { computed } from "vue";
import { GET_MODS_BY_CHANNEL } from "@/graphQLData/mod/queries";
import { useQuery } from "@vue/apollo-composable";
import { useRoute } from "nuxt/app";

const route = useRoute();
const forumId = computed(() => {
  if (typeof route.params.forumId === "string") {
    return route.params.forumId;
  }
  return "";
});

const { result, loading, error } = useQuery(
  GET_MODS_BY_CHANNEL,
  () => ({
    channelUniqueName: forumId.value,
  }),
  {
    fetchPolicy: "cache-first",
  }
);
const mods = computed(() => result.value?.channels[0]?.Moderators);

defineEmits(["click-remove-mod"]);
</script>
<template>
  <div class="flex flex-col gap-3 py-3 dark:text-white">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error</div>
    <div
      v-else-if="
        result?.channels?.length === 0 ||
        result.channels[0]?.Moderators?.length === 0
      "
      class="text-sm"
    >
      This forum has no mods.
    </div>
    <div v-if="mods && mods.length > 0" class="flex-col text-sm font-bold">
      <div
        v-for="mod in mods"
        :key="mod.displayName"
        class="flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
      >
        <nuxt-link
          :to="{ name: 'mod-modId', params: { modId: mod.displayName } }"
          class="flex items-center dark:text-white"
        >
          <AvatarComponent :text="mod.displayName" class="mr-2 h-6 w-6" />
          <span class="text-sm font-bold">{{
            `${mod.displayName} ${mod.User?.username ? `(${mod.User?.username})` : ""}`
          }}</span>
        </nuxt-link>
        <button
<<<<<<< HEAD
          class="flex items-center gap-1 rounded border border-orange-500 px-2 py-1 text-orange-500"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
          type="button"
          class="flex rounded border border-blue-500 px-2 py-1 text-blue-500 items-center gap-1"
          @click="$emit('click-remove-mod', mod.User?.username)"
        >
          Remove Mod
        </button>
      </div>
    </div>
  </div>
</template>
