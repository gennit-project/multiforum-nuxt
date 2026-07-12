<script setup lang="ts">
import { ref, watch, toRef } from 'vue';
import { useRouter } from 'nuxt/app';
import RecentForumsList from './RecentForumsList.vue';
import ForumFinder from './ForumFinder.vue';
import SearchIcon from '@/components/icons/SearchIcon.vue';
import { useFocusTrap } from '@/composables/useFocusTrap';

type ForumItem = {
  uniqueName: string;
  channelIconURL?: string | null;
  timestamp: number;
};

const props = defineProps<{
  forums: ForumItem[];
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();

const isFindingForum = ref(false);

// Modal drawer: trap focus inside the panel while open, Escape to close, and
// restore focus to the trigger on close.
const panelRef = ref<HTMLElement | null>(null);
useFocusTrap(panelRef, {
  active: toRef(props, 'isOpen'),
  onEscape: () => emit('close'),
});

// Reset back to the recent-forums view whenever the drawer is reopened.
watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      isFindingForum.value = false;
    }
  }
);

const closeDrawer = () => {
  emit('close');
};

const goToForum = (uniqueName: string) => {
  router.push({
    name: 'forums-forumId-discussions',
    params: { forumId: uniqueName },
  });
  closeDrawer();
};
</script>

<template>
  <ClientOnly>
    <!-- Backdrop -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-30 bg-black bg-opacity-50"
      @click="closeDrawer"
    />

    <!-- Drawer -->
    <Transition
      enter-active-class="transform transition duration-300 ease-out"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transform transition duration-300 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <div
        v-if="isOpen"
        ref="panelRef"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recent-forums-drawer-title"
        class="fixed left-0 top-0 z-40 h-full w-80 overflow-y-auto border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-600"
        >
          <h3
            id="recent-forums-drawer-title"
            class="font-semibold text-lg text-gray-900 dark:text-gray-100"
          >
            Recent Forums
          </h3>
          <button
            type="button"
            class="rounded-full p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-gray-200"
            @click="closeDrawer"
          >
            <span class="sr-only">Close</span>
            <svg
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Forums List -->
        <div class="p-4">
          <!-- Find Forum search -->
          <div v-if="isFindingForum" class="mb-2">
            <div class="mb-2 flex items-center justify-between">
              <span
                class="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Find a forum
              </span>
              <button
                type="button"
                class="text-xs text-gray-500 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200"
                @click="isFindingForum = false"
              >
                Cancel
              </button>
            </div>
            <ForumFinder @select="goToForum" />
          </div>

          <!-- Recent forums view -->
          <template v-else>
            <!-- Find Forum Button -->
            <button
              type="button"
              data-testid="find-forum-button"
              class="font-semibold group mb-2 flex w-full items-center gap-x-3 rounded-md px-2 py-2 text-sm leading-6 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
              @click="isFindingForum = true"
            >
              <SearchIcon class="text-gray-500 dark:text-gray-400" />
              Find Forum
            </button>

            <!-- Divider -->
            <div
              v-if="forums.length > 0"
              class="mb-4 border-t border-gray-200 dark:border-gray-600"
            />

            <RecentForumsList
              :forums="forums"
              :show-header="false"
              :on-navigate="closeDrawer"
              link-classes="font-semibold group flex items-center gap-x-3 rounded-md py-2 text-sm leading-6 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700 px-2"
            />

            <div
              v-if="forums.length === 0"
              class="py-8 text-center text-gray-500 dark:text-gray-400"
            >
              No recent forums yet
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </ClientOnly>
</template>
