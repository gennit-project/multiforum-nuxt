<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { useRoute } from 'nuxt/app';
import { MessageSquare } from 'lucide-vue-next';
import type { DiscussionChannel } from '@/__generated__/graphql';

type Submission = Pick<DiscussionChannel, 'channelUniqueName'> & {
  CommentsAggregate?: Pick<
    NonNullable<DiscussionChannel['CommentsAggregate']>,
    'count'
  > | null;
};
const props = withDefaults(
  defineProps<{
    submissions: Submission[];
    contentId: string;
    kind: 'discussion' | 'event';
    selectedForum?: string;
    preview?: boolean;
    compact?: boolean;
  }>(),
  { selectedForum: '', preview: false, compact: false }
);
const route = useRoute();
const expanded = ref(false);
const listId = useId();
// Keep source order stable. A selected forum beyond the first four remains
// visible, so the collapsed selector never hides the current conversation.
const visible = computed(() => {
  if (expanded.value) return props.submissions;
  const first = props.submissions.slice(0, 4);
  const selected = props.submissions.find(
    (s) => s.channelUniqueName === props.selectedForum
  );
  if (selected && !first.includes(selected)) first.splice(3, 1, selected);
  return first;
});
const detailLink = (forum: string) =>
  `/forums/${encodeURIComponent(forum)}/${props.kind === 'discussion' ? 'discussions' : 'events'}/${encodeURIComponent(props.contentId)}`;
const previewLink = (forum: string) => ({
  path: route.path,
  query: {
    ...route.query,
    selectedDiscussionId: props.contentId,
    selectedForum: forum,
  },
});
const label = (submission: Submission) =>
  props.kind === 'discussion'
    ? `${submission.channelUniqueName}: ${submission.CommentsAggregate?.count ?? 0} ${submission.CommentsAggregate?.count === 1 ? 'comment' : 'comments'}`
    : `View event in ${submission.channelUniqueName}`;
</script>

<template>
  <div
    v-if="submissions.length"
    class="min-w-0"
    :class="
      compact
        ? 'grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-1'
        : ''
    "
    data-testid="forum-submissions"
  >
    <p
      class="text-xs font-medium text-gray-600 dark:text-gray-400"
      :class="compact ? 'pt-1.5' : 'mb-2'"
    >
      {{ kind === 'discussion' ? 'Discuss in' : 'Shared in' }}
      <span :class="compact ? 'sr-only' : ''"
        >{{ submissions.length }}
        {{ submissions.length === 1 ? 'forum' : 'forums' }}</span
      >
    </p>
    <ul
      :id="listId"
      class="flex flex-wrap items-center"
      :class="compact ? 'min-w-0 flex-1 gap-1' : 'gap-2'"
      role="list"
    >
      <li
        v-for="submission in visible"
        :key="submission.channelUniqueName"
        class="max-w-full min-w-0"
      >
        <NuxtLink
          v-for="mode in preview && kind === 'discussion'
            ? ['mobile', 'desktop']
            : ['all']"
          :key="mode"
          :to="
            mode === 'desktop'
              ? previewLink(submission.channelUniqueName)
              : detailLink(submission.channelUniqueName)
          "
          :aria-label="label(submission)"
          :aria-current="
            selectedForum === submission.channelUniqueName ? 'true' : undefined
          "
          class="focus-visible:ring-brand-500 max-w-full items-center gap-2 rounded-lg border text-xs font-medium focus-visible:ring-2"
          :class="[
            compact ? 'min-h-7 px-2 py-1' : 'min-h-9 px-2.5 py-1.5',
            mode === 'mobile'
              ? 'inline-flex lg:hidden'
              : mode === 'desktop'
                ? 'hidden lg:inline-flex'
                : 'inline-flex',
            selectedForum === submission.channelUniqueName
              ? 'border-brand-600 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-300'
              : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
          ]"
        >
          <span class="truncate">{{ submission.channelUniqueName }}</span>
          <template v-if="kind === 'discussion'">
            <MessageSquare class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{{ submission.CommentsAggregate?.count ?? 0 }}</span>
          </template>
        </NuxtLink>
      </li>
    </ul>
    <button
      v-if="submissions.length > 4"
      type="button"
      :aria-expanded="expanded"
      :aria-controls="listId"
      class="focus-visible:ring-brand-500 rounded px-1 text-xs font-semibold text-gray-700 underline underline-offset-4 focus-visible:ring-2 dark:text-gray-200"
      :class="
        compact ? 'col-start-2 min-h-7 justify-self-start' : 'mt-1 min-h-9'
      "
      @click="expanded = !expanded"
    >
      {{
        expanded ? 'Show fewer forums' : `Show all ${submissions.length} forums`
      }}
    </button>
  </div>
</template>
