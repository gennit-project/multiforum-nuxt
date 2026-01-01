<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useRoute } from 'nuxt/app';
import { GET_MOD_CONTRIBUTIONS } from '@/graphQLData/mod/queries';
import {
  getModActivityLinks,
  type ModActivityLinkInput,
} from '@/utils/modContributionLinks';
import { timeAgo } from '@/utils';
import ErrorBanner from '@/components/ErrorBanner.vue';

type ModActivity = ModActivityLinkInput & {
  id?: string;
  actionType?: string | null;
  actionDescription?: string | null;
  createdAt?: string | null;
};

type ModDay = {
  date?: string | null;
  activities?: ModActivity[] | null;
};

const route = useRoute();
const modProfileName = computed(() => {
  return typeof route.params.modId === 'string' ? route.params.modId : '';
});

const { result, loading, error } = useQuery(
  GET_MOD_CONTRIBUTIONS,
  () => ({
    displayName: modProfileName.value,
    year: null,
  }),
  {
    fetchPolicy: 'cache-first',
  }
);

const activities = computed(() => {
  const days = result.value?.getModContributions as ModDay[] | undefined;
  if (!Array.isArray(days)) return [];

  const items: Array<ModActivity & { date?: string | null }> = [];
  for (const day of days) {
    if (!day || !Array.isArray(day.activities)) continue;
    for (const activity of day.activities) {
      if (!activity) continue;
      items.push({ ...activity, date: day.date });
    }
  }

  return items.sort((a, b) => {
    const aDate = a.createdAt || a.date || '';
    const bDate = b.createdAt || b.date || '';
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
});

const buildLinks = (activity: ModActivity) => getModActivityLinks(activity);
</script>

<template>
  <div class="py-3 dark:text-white">
    <ErrorBanner v-if="error" :text="error.message" />
    <div v-else-if="loading" class="text-sm text-gray-500 dark:text-gray-400">
      Loading actions...
    </div>
    <div
      v-else-if="activities.length === 0"
      class="text-sm text-gray-500 dark:text-gray-400"
    >
      No moderation actions yet.
    </div>
    <ul v-else class="divide-y border-t border-gray-200 dark:border-gray-800">
      <li v-for="activity in activities" :key="activity.id" class="px-2 py-4">
        <div class="flex flex-col gap-2">
          <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{
              activity.actionDescription ||
              activity.actionType ||
              'Moderation activity'
            }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{
              activity.createdAt ? timeAgo(new Date(activity.createdAt)) : ''
            }}
          </div>
          <div
            class="flex flex-wrap gap-3 text-xs font-medium text-gray-600 dark:text-gray-300"
          >
            <nuxt-link
              v-for="link in buildLinks(activity)"
              :key="`${link.label}-${link.to.name}`"
              :to="link.to"
              class="underline"
            >
              {{ link.label }}
            </nuxt-link>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
