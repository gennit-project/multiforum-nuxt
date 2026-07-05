<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import type { Channel, WikiPage } from '@/__generated__/graphql';
import {
  LOCK_WIKI_PAGE,
  UNLOCK_WIKI_PAGE,
} from '@/graphQLData/channel/mutations';
import { useToast } from '@/composables/useToast';
import { useUsername } from '@/composables/useAuthState';
import { canManageLockedWikiPage } from '@/utils/wikiPageLockPermissions';

type LockableWikiPage = Pick<WikiPage, 'id'> & {
  locked?: boolean | null;
};

const props = defineProps({
  channel: {
    type: Object as PropType<Channel>,
    required: true,
  },
  wikiPage: {
    type: Object as PropType<LockableWikiPage>,
    required: true,
  },
});

const emit = defineEmits<{
  (event: 'lockChanged'): void;
}>();

const toast = useToast();
const username = useUsername();

const { mutate: lockWikiPage, loading: lockLoading } =
  useMutation(LOCK_WIKI_PAGE);
const { mutate: unlockWikiPage, loading: unlockLoading } =
  useMutation(UNLOCK_WIKI_PAGE);

const isLocked = computed(() => props.wikiPage.locked === true);
const canManage = computed(() =>
  canManageLockedWikiPage({
    channel: props.channel,
    username: username.value,
  })
);
const isSaving = computed(() => lockLoading.value || unlockLoading.value);

const toggleLock = async () => {
  try {
    if (isLocked.value) {
      await unlockWikiPage({ wikiPageId: props.wikiPage.id });
      toast.success('Wiki page unlocked.');
    } else {
      const reason = window.prompt('Reason for locking this wiki page?');

      if (!reason?.trim()) {
        return;
      }

      await lockWikiPage({
        wikiPageId: props.wikiPage.id,
        reason: reason.trim(),
      });
      toast.success('Wiki page locked.');
    }

    emit('lockChanged');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    toast.error(`Could not update wiki page lock: ${message}`);
  }
};
</script>

<template>
  <button
    v-if="canManage"
    type="button"
    class="inline-flex items-center gap-2 rounded-md border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-950"
    :disabled="isSaving"
    @click="toggleLock"
  >
    <i :class="['fa-solid', isLocked ? 'fa-lock-open' : 'fa-lock']" />
    <span>{{ isLocked ? 'Unlock page' : 'Lock page' }}</span>
  </button>
</template>
