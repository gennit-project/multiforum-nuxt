<script setup lang="ts">
import { computed, type PropType } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import type { Channel, WikiPage } from '@/__generated__/graphql';
import {
  PIN_WIKI_PAGE_TO_CHANNEL,
  UNPIN_WIKI_PAGE_FROM_CHANNEL,
} from '@/graphQLData/channel/mutations';
import { useIsAuthenticated, useUsername } from '@/composables/useAuthState';
import { useToast } from '@/composables/useToast';

type WikiPin = Pick<WikiPage, 'id' | 'title' | 'slug'>;
type ChannelWithWikiPins = Channel & {
  PinnedWikiPages?: WikiPin[] | null;
};

const props = defineProps({
  channel: {
    type: Object as PropType<ChannelWithWikiPins>,
    required: true,
  },
  wikiPage: {
    type: Object as PropType<WikiPin>,
    required: true,
  },
  channelUniqueName: {
    type: String,
    required: true,
  },
});

const emit = defineEmits<{
  (event: 'pinnedChanged'): void;
}>();

const isAuthenticated = useIsAuthenticated();
const username = useUsername();
const toast = useToast();

const { mutate: pinWikiPage, loading: pinLoading } = useMutation(
  PIN_WIKI_PAGE_TO_CHANNEL
);
const { mutate: unpinWikiPage, loading: unpinLoading } = useMutation(
  UNPIN_WIKI_PAGE_FROM_CHANNEL
);

const isPinned = computed(() =>
  (props.channel.PinnedWikiPages || []).some((page) => page.id === props.wikiPage.id)
);

const isChannelOwner = computed(() =>
  (props.channel.Admins || []).some((admin) => admin.username === username.value)
);

const isSuspendedUser = computed(() =>
  (props.channel.SuspendedUsers || []).some((user) => user.username === username.value)
);

const canUpdateChannel = computed(() => {
  if (!isAuthenticated.value || !username.value || isSuspendedUser.value) {
    return false;
  }

  if (isChannelOwner.value) {
    return props.channel.ElevatedChannelRole
      ? props.channel.ElevatedChannelRole.canUpdateChannel === true
      : true;
  }

  return props.channel.DefaultChannelRole?.canUpdateChannel === true;
});

const isSaving = computed(() => pinLoading.value || unpinLoading.value);

const togglePin = async () => {
  const mutate = isPinned.value ? unpinWikiPage : pinWikiPage;

  try {
    await mutate({
      channelUniqueName: props.channelUniqueName,
      wikiPageId: props.wikiPage.id,
    });
    toast.success(
      isPinned.value
        ? 'Wiki page removed from the forum sidebar.'
        : 'Wiki page pinned to the forum sidebar.'
    );
    emit('pinnedChanged');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    toast.error(`Could not update wiki sidebar pins: ${message}`);
  }
};
</script>

<template>
  <button
    v-if="canUpdateChannel"
    type="button"
    class="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
    :disabled="isSaving"
    @click="togglePin"
  >
    <i :class="['fa-solid fa-thumbtack', isPinned ? '' : 'opacity-60']" />
    <span>{{ isPinned ? 'Unpin from sidebar' : 'Pin to sidebar' }}</span>
  </button>
</template>
