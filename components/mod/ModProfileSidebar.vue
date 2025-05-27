<script lang="ts" setup>
import { computed } from "vue";
import { useQuery } from "@vue/apollo-composable";
import "md-editor-v3/lib/style.css";
import { GET_MOD } from "@/graphQLData/mod/queries";
import { relativeTime } from "@/utils";
import { useRoute } from "nuxt/app";
import { modProfileNameVar } from "@/cache";

defineProps({
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();

const modName = computed(() => {
  if (typeof route.params.modId === "string") {
    return route.params.modId;
  }
  return "";
});

const modProfileIsYourself = computed(() => {
  return modProfileNameVar.value === modName.value;
});

const {
  result,
  error: getModError,
} = useQuery(GET_MOD, () => ({
  displayName: modName.value,
}));

const mod = computed(() => {
  return result.value?.moderationProfiles[0] || null;
});
</script>

<template>
  <div class="rounded-lg pt-6">
    <div class="mb-4 mt-6 p-2 flex flex-col gap-2">
      <AvatarComponent
        :text="mod?.displayName || ''"
        :is-square="false"
        :is-medium="true"
      />
      <label>Mod Profile</label>
      <h1
        v-if="mod?.displayName"
        class="flex border-gray-700 text-xl font-bold leading-6 text-gray-500 dark:text-gray-200"
      >
        {{ mod.displayName }}<span v-if="modProfileIsYourself" class="ml-2">(You)</span>
      </h1>
      <div
        v-if="mod?.createdAt"
        class="min-w-0 flex-1 sm:block 2xl:hidden"
      >
        {{ `Joined ${relativeTime(mod.createdAt)}` }}
      </div>
    </div>
  </div>

  <div class="w-full">
    <div v-if="getModError">
      <div v-for="(error, i) of getModError?.graphQLErrors" :key="i">
        {{ error.message }}
      </div>
    </div>
    <div v-else-if="!mod" class="px-4">Could not find the user.</div>
  </div>
</template>
