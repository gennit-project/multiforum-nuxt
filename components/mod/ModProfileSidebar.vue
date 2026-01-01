<script lang="ts" setup>
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import 'md-editor-v3/lib/style.css';
import { GET_MOD } from '@/graphQLData/mod/queries';
import { relativeTime } from '@/utils';
import { useRoute } from 'nuxt/app';
import { modProfileNameVar } from '@/cache';

defineProps({
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();

const modName = computed(() => {
  if (typeof route.params.modId === 'string') {
    return route.params.modId;
  }
  return '';
});

const modProfileIsYourself = computed(() => {
  return modProfileNameVar.value === modName.value;
});

const { result, error: getModError } = useQuery(GET_MOD, () => ({
  displayName: modName.value,
}));

const mod = computed(() => {
  return result.value?.moderationProfiles[0] || null;
});
</script>

<template>
  <div class="rounded-lg pt-2">
    <div
      class="mb-3 mt-2 flex flex-col gap-2 p-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex min-w-0 items-center gap-3">
        <AvatarComponent
          :text="mod?.displayName || ''"
          :is-square="false"
          :is-small="true"
        />
        <div class="min-w-0">
          <p
            class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
          >
            Mod Profile
          </p>
          <h1
            v-if="mod?.displayName"
            class="flex break-words text-lg font-bold leading-5 text-gray-600 dark:text-gray-200"
          >
            {{ mod.displayName
            }}<span v-if="modProfileIsYourself" class="ml-2 text-sm"
              >(You)</span
            >
          </h1>
        </div>
      </div>
      <div
        v-if="mod?.createdAt"
        class="text-sm text-gray-500 dark:text-gray-400 sm:text-right"
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
