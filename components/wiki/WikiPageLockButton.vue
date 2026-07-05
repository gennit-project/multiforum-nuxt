<script setup lang="ts">
import { computed, ref, type PropType } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import type { Channel } from '@/__generated__/graphql';
import {
  LOCK_WIKI_PAGE,
  UNLOCK_WIKI_PAGE,
} from '@/graphQLData/channel/mutations';
import { useToast } from '@/composables/useToast';
import { useWikiPageLockPermissions } from '@/composables/useWikiPageLockPermissions';

type WikiPageLockState = {
  id: string;
  locked?: boolean | null;
  lockedAt?: string | null;
  lockReason?: string | null;
  lockedByUsername?: string | null;
};

const props = defineProps({
  channel: {
    type: Object as PropType<Channel>,
    required: true,
  },
  wikiPage: {
    type: Object as PropType<WikiPageLockState>,
    required: true,
  },
  channelUniqueName: {
    type: String,
    required: true,
  },
});

const emit = defineEmits<{
  (event: 'lockChanged'): void;
}>();

const toast = useToast();
const lockReason = ref('');
const showLockForm = ref(false);

const channelRef = computed(() => props.channel);
const { canManageWikiPageLock } = useWikiPageLockPermissions(channelRef);

const { mutate: lockWikiPage, loading: lockLoading } =
  useMutation(LOCK_WIKI_PAGE);
const { mutate: unlockWikiPage, loading: unlockLoading } =
  useMutation(UNLOCK_WIKI_PAGE);

const isSaving = computed(() => lockLoading.value || unlockLoading.value);
const isLocked = computed(() => props.wikiPage.locked === true);
const trimmedReason = computed(() => lockReason.value.trim());

const handleLock = async () => {
  if (!trimmedReason.value) return;

  try {
    await lockWikiPage({
      channelUniqueName: props.channelUniqueName,
      wikiPageId: props.wikiPage.id,
      reason: trimmedReason.value,
    });
    toast.success('Wiki page locked.');
    showLockForm.value = false;
    lockReason.value = '';
    emit('lockChanged');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    toast.error(`Could not lock wiki page: ${message}`);
  }
};

const handleUnlock = async () => {
  try {
    await unlockWikiPage({
      channelUniqueName: props.channelUniqueName,
      wikiPageId: props.wikiPage.id,
    });
    toast.success('Wiki page unlocked.');
    emit('lockChanged');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    toast.error(`Could not unlock wiki page: ${message}`);
  }
};
</script>

<template>
  <div v-if="canManageWikiPageLock" class="flex flex-col items-end gap-2">
    <button
      v-if="isLocked"
      type="button"
      class="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
      :disabled="isSaving"
      @click="handleUnlock"
    >
      <i class="fa-solid fa-lock-open" />
      <span>Unlock page</span>
    </button>
    <button
      v-else
      type="button"
      class="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
      :disabled="isSaving"
      @click="showLockForm = !showLockForm"
    >
      <i class="fa-solid fa-lock" />
      <span>Lock page</span>
    </button>

    <form
      v-if="showLockForm && !isLocked"
      class="w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900"
      @submit.prevent="handleLock"
    >
      <label
        for="wiki-lock-reason"
        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        Lock reason
      </label>
      <textarea
        id="wiki-lock-reason"
        v-model="lockReason"
        class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
        rows="3"
        placeholder="Explain why this wiki page is locked"
      />
      <div class="mt-2 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          :disabled="isSaving"
          @click="showLockForm = false"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isSaving || !trimmedReason"
        >
          Lock page
        </button>
      </div>
    </form>
  </div>
</template>
