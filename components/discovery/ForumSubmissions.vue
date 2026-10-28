<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { useRoute } from 'nuxt/app';
import AvatarComponent from '@/components/AvatarComponent.vue';
import { MessageSquare } from 'lucide-vue-next';

type Submission = {
  channelUniqueName: string;
  Channel?: { channelIconURL?: string | null } | null;
  CommentsConnection?: {
    aggregate?: { count?: { nodes?: number | null } | null } | null;
  } | null;
};
const props = withDefaults(
  defineProps<{
    submissions: Submission[];
    contentId: string;
    kind: 'discussion' | 'event';
    selectedForum?: string;
    preview?: boolean;
    compact?: boolean;
    subtle?: boolean;
    mobileLayout?: boolean;
  }>(),
  {
    selectedForum: '',
    preview: false,
    compact: false,
    subtle: false,
    mobileLayout: false,
  }
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
    ? `${submission.channelUniqueName}: ${submission.CommentsConnection?.aggregate?.count?.nodes ?? 0} ${submission.CommentsConnection?.aggregate?.count?.nodes === 1 ? 'comment' : 'comments'}`
    : `View event in ${submission.channelUniqueName}`;
</script>

<template>
  <div
    v-if="submissions.length || $slots.actions"
    class="min-w-0"
    :class="[
      mobileLayout ? 'mobile-forum-submissions' : '',
      compact && kind === 'event'
        ? 'flex flex-wrap items-center gap-x-2 gap-y-1'
        : '',
      compact && kind === 'discussion'
        ? mobileLayout
          ? 'flex flex-wrap items-center gap-x-1.5 gap-y-1 lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-x-2'
          : 'grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-1'
        : '',
    ]"
    data-testid="forum-submissions"
  >
    <p
      v-if="submissions.length"
      class="text-xs"
      :class="[
        compact && kind === 'discussion' ? 'pt-1.5' : '',
        compact && kind === 'event' ? 'shrink-0' : '',
        !compact ? 'mb-2' : '',
        subtle
          ? 'font-normal text-gray-500 dark:text-gray-400'
          : 'font-medium text-gray-600 dark:text-gray-400',
      ]"
    >
      {{ kind === 'discussion' ? 'Discuss in' : 'Submitted to' }}
      <span :class="compact ? 'sr-only' : ''"
        >{{ submissions.length }}
        {{ submissions.length === 1 ? 'forum' : 'forums' }}</span
      >
    </p>
    <ul
      :id="listId"
      class="flex-wrap items-center"
      :class="[
        mobileLayout ? 'contents lg:flex' : 'flex',
        compact ? 'min-w-0 flex-1 gap-1' : 'gap-2',
      ]"
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
          class="focus-visible:ring-brand-500 max-w-full items-center gap-2 rounded-lg border text-xs focus-visible:ring-2"
          :class="[
            compact ? 'min-h-7 px-2 py-1' : 'min-h-9 px-2.5 py-1.5',
            mode === 'mobile'
              ? 'inline-flex lg:hidden'
              : mode === 'desktop'
                ? 'hidden lg:inline-flex'
                : 'inline-flex',
            selectedForum === submission.channelUniqueName
              ? 'border-brand-600 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-300 font-medium'
              : subtle
                ? 'border-gray-200 bg-gray-50 font-normal text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-300 dark:hover:bg-gray-700'
                : 'border-gray-300 bg-gray-50 font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
          ]"
        >
          <AvatarComponent
            v-if="mobileLayout"
            class="forum-icon h-5 w-5 shrink-0 rounded-full lg:hidden"
            :text="submission.channelUniqueName"
            :src="submission.Channel?.channelIconURL || ''"
            :is-square="false"
            :is-decorative="true"
          />
          <span
            :class="
              mobileLayout
                ? 'min-w-0 wrap-anywhere whitespace-normal lg:truncate'
                : 'truncate'
            "
            >{{ submission.channelUniqueName }}</span
          >
          <template v-if="kind === 'discussion'">
            <MessageSquare class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{{
              submission.CommentsConnection?.aggregate?.count?.nodes ?? 0
            }}</span>
          </template>
        </NuxtLink>
      </li>
    </ul>
    <div
      v-if="compact && (submissions.length > 4 || $slots.trailing)"
      class="forum-submissions-trailing flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1"
      :class="
        kind === 'discussion'
          ? 'col-start-2 justify-between'
          : 'basis-full justify-start'
      "
    >
      <button
        v-if="submissions.length > 4"
        type="button"
        :aria-expanded="expanded"
        :aria-controls="listId"
        class="focus-visible:ring-brand-500 min-h-7 rounded px-1 text-xs font-semibold text-gray-700 underline underline-offset-4 focus-visible:ring-2 dark:text-gray-200"
        @click="expanded = !expanded"
      >
        {{
          expanded
            ? 'Show fewer forums'
            : `Show all ${submissions.length} forums`
        }}
      </button>
      <slot name="trailing" />
    </div>
    <button
      v-else-if="submissions.length > 4"
      type="button"
      :aria-expanded="expanded"
      :aria-controls="listId"
      class="focus-visible:ring-brand-500 mt-1 min-h-9 rounded px-1 text-xs font-semibold text-gray-700 underline underline-offset-4 focus-visible:ring-2 dark:text-gray-200"
      @click="expanded = !expanded"
    >
      {{
        expanded ? 'Show fewer forums' : `Show all ${submissions.length} forums`
      }}
    </button>
    <slot name="actions" />
  </div>
</template>

<style scoped>
@media (width < 64rem) {
  .mobile-forum-submissions > p {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .forum-icon :deep(img) {
    width: 20px;
    height: 20px;
  }

  .mobile-forum-submissions li > a {
    min-height: 32px;
    gap: 6px;
    padding: 4px 6px;
  }

  .mobile-forum-submissions > .forum-submissions-trailing {
    flex-basis: 100%;
  }
}
</style>
