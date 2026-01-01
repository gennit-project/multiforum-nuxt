<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useRoute } from 'nuxt/app';
import { useUIStore } from '@/stores/uiStore';
import GithubContributionChart from './GithubContributionChart.vue';
import ContributionChartSkeleton from './ContributionChartSkeleton.vue';
import { GET_MOD, GET_MOD_CONTRIBUTIONS } from '@/graphQLData/mod/queries';
import type { DayData, Activity } from '@/types/contribution';
import { getModActivityLinks } from '@/utils/modContributionLinks';

type IssueInfo = {
  id?: string;
  issueNumber?: number;
  channelUniqueName?: string;
  relatedDiscussionId?: string;
  relatedEventId?: string;
  relatedCommentId?: string;
  title?: string;
  isOpen?: boolean;
};

type DiscussionChannelInfo = {
  id?: string;
  discussionId?: string;
  channelUniqueName?: string;
};

type EventChannelInfo = {
  id?: string;
  eventId?: string;
  channelUniqueName?: string;
};

type DiscussionInfo = {
  id?: string;
  title?: string;
  createdAt?: string;
  DiscussionChannels?: DiscussionChannelInfo[];
};

type EventInfo = {
  id?: string;
  title?: string;
  createdAt?: string;
  EventChannels?: EventChannelInfo[];
};

type CommentInfo = {
  id?: string;
  text?: string;
  createdAt?: string;
  DiscussionChannel?: DiscussionChannelInfo | null;
  Event?: EventInfo | null;
};

type ModActivity = Activity & {
  actionType?: string | null;
  actionDescription?: string | null;
  createdAt?: string | null;
  Issue?: IssueInfo | null;
  Comment?: CommentInfo | null;
  RelatedDiscussion?: DiscussionInfo | null;
  RelatedEvent?: EventInfo | null;
  RelatedComment?: CommentInfo | null;
};

type ModDayData = DayData & {
  activities: ModActivity[];
};

const uiStore = useUIStore();
const isDarkMode = computed(() => uiStore.theme === 'dark');

const route = useRoute();
const modProfileName = computed(() => {
  return typeof route.params.modId === 'string' ? route.params.modId : '';
});

const queryYear = ref<number | null>(null);
const displayYear = ref(new Date().getFullYear());

const { result: modResult } = useQuery(
  GET_MOD,
  {
    displayName: modProfileName,
  },
  {
    fetchPolicy: 'cache-first',
  }
);

const minYear = computed(() => {
  if (modResult.value?.moderationProfiles?.[0]?.createdAt) {
    const createdAt = new Date(modResult.value.moderationProfiles[0].createdAt);
    return createdAt.getFullYear();
  }
  return new Date().getFullYear() - 3;
});

const { result: contributionsResult, loading } = useQuery(
  GET_MOD_CONTRIBUTIONS,
  {
    displayName: modProfileName,
    year: queryYear,
  },
  {
    fetchPolicy: 'cache-first',
  }
);

const contributions = computed<ModDayData[]>(() => {
  try {
    const rawData = contributionsResult.value?.getModContributions;
    if (!Array.isArray(rawData)) {
      return [];
    }

    return rawData
      .map((day) => {
        if (!day) return null;
        const activities = Array.isArray(day.activities)
          ? day.activities.map((activity: ModActivity) => ({
              ...activity,
              type: activity.actionType || 'moderation',
              description: activity.actionDescription || '',
            }))
          : [];
        const finalCount =
          typeof day.count === 'number' ? day.count : activities.length;

        return {
          date: day.date,
          count: finalCount,
          activities,
        };
      })
      .filter((day) => day !== null) as ModDayData[];
  } catch (error) {
    console.error('Error processing mod contribution data:', error);
  }
  return [];
});

type ContributionDay = {
  date: string;
  count: number;
  activities: ModActivity[];
  week: number;
  day: number;
};

const selectedDay = ref<ContributionDay | null>(null);
const logSelected = (day: ContributionDay | null) => {
  selectedDay.value = day;
};

const setYear = (newYear: number) => {
  queryYear.value = newYear;
  displayYear.value = newYear;
};

const currentYear = computed(() => new Date().getFullYear());

const formatDate = (date: string) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('default', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const buildLinks = (activity: ModActivity) => getModActivityLinks(activity);
</script>

<template>
  <div class="overflow-hidden rounded-lg">
    <client-only>
      <GithubContributionChart
        :dark-mode="isDarkMode"
        :contribution-data="contributions"
        :loading="loading"
        :year="displayYear"
        :min-year="minYear"
        :max-year="currentYear"
        :show-details="false"
        @day-select="logSelected"
        @year-select="setYear"
      >
        <template #fallback>
          <ContributionChartSkeleton :dark-mode="isDarkMode" />
        </template>
      </GithubContributionChart>
    </client-only>

    <div
      v-if="selectedDay"
      class="mt-4 rounded-lg border p-4"
      :class="isDarkMode ? 'border-green-500' : 'bg-gray-50 border-green-500'"
    >
      <div class="flex gap-3">
        <div class="w-full">
          <h3 class="font-medium">{{ formatDate(selectedDay.date) }}</h3>
          <p
            class="text-sm"
            :class="isDarkMode ? 'text-gray-300' : 'text-gray-700'"
          >
            <template v-if="selectedDay.count === 0">
              No moderation activity on this day
            </template>
            <template v-else>
              {{ selectedDay.count }} activities on this day
            </template>
          </p>

          <div v-if="selectedDay.count > 0" class="mt-2">
            <div
              class="mb-1 mt-3 text-xs font-medium uppercase tracking-wide"
              :class="isDarkMode ? 'text-gray-400' : 'text-gray-600'"
            >
              Activity Details
            </div>
            <ul
              class="mt-1 space-y-3 text-sm"
              :class="isDarkMode ? 'text-gray-300' : 'text-gray-700'"
            >
              <li
                v-for="activity in selectedDay.activities"
                :key="activity.id"
                class="rounded-md border px-3 py-2"
                :class="isDarkMode ? 'border-gray-700' : 'border-gray-200'"
              >
                <div class="flex flex-col gap-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="font-medium">
                      {{ activity.actionType || 'activity' }}
                    </span>
                    <span>
                      {{ activity.actionDescription || 'Moderation activity' }}
                    </span>
                  </div>
                  <div
                    v-if="activity.Comment?.text"
                    class="text-xs"
                    :class="isDarkMode ? 'text-gray-400' : 'text-gray-600'"
                  >
                    {{ activity.Comment.text }}
                  </div>
                  <div class="flex flex-wrap gap-3 text-xs font-medium">
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
        </div>
      </div>
    </div>
  </div>
</template>
