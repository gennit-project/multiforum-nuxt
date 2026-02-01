<script setup lang="ts">
import { useRouter } from 'nuxt/app';
import RecentForumsList from './RecentForumsList.vue';

type ForumItem = {
  uniqueName: string;
  channelIconURL?: string | null;
  timestamp: number;
};

defineProps<{
  forums: ForumItem[];
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();

const closeDrawer = () => {
  emit('close');
};

const navigateToCreateForum = () => {
  router.push('/forums/create');
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
        class="fixed left-0 top-0 z-40 h-full w-80 overflow-y-auto border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-600"
        >
          <h3 class="font-semibold text-lg text-gray-900 dark:text-gray-100">
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
          <!-- Add Forum Button -->
          <button
            type="button"
            class="font-semibold group mb-2 flex w-full items-center gap-x-3 rounded-md px-2 py-2 text-sm leading-6 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
            @click="navigateToCreateForum"
          >
            <span class="font-bold text-green-600 dark:text-green-400">+</span>
            Add Forum
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
        </div>
      </div>
    </Transition>
  </ClientOnly>
</template>
