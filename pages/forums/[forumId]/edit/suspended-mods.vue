<script lang="ts" setup>
import SuspendedModList from "@/components/channel/form/SuspendedModList.vue";
import { computed } from "vue";
import { useRoute } from "nuxt/app";

const route = useRoute();

const forumId = computed(() => {
  if (typeof route.params.forumId === "string") {
    return route.params.forumId;
  }
  return "";
});
</script>

<template>
  <div class="flex-col space-y-4 dark:text-white">
    <div class="mb-6">
      <h1 class="text-xl font-bold mb-2">Suspended Mods</h1>
      <p class="text-gray-600 text-sm dark:text-gray-400">
        {{ `These mods have been suspended from ${forumId}.` }}
      </p>
      <ul
        class="text-gray-600 text-sm dark:text-gray-400 list-disc ml-4 list-outside"
      >
        <li>
          To un-suspend a mod, click Related Issue and follow the provided
          instructions.
        </li>
        <li>
          To suspend a mod, go to the rule-breaking comment or post and click
          Suspend Mod in the action menu.
        </li>
      </ul>
    </div>
    <FormRow>
      <template #content>
        <SuspendedModList />
      </template>
    </FormRow>
  </div>
</template>
