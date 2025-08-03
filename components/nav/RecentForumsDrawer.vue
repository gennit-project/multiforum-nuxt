<script setup lang="ts">
import { ref } from "vue";
import RecentForumsList from "./RecentForumsList.vue";

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

const closeDrawer = () => {
  emit('close');
};
</script>

<template>
  <ClientOnly>
    <!-- Backdrop -->
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-30"
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
        class="fixed left-16 top-0 h-full w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-40 overflow-y-auto"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Forums
          </h3>
          <button
            type="button"
            class="rounded-full p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-gray-200"
            @click="closeDrawer"
          >
            <span class="sr-only">Close</span>
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Forums List -->
        <div class="p-4">
          <RecentForumsList
            :forums="forums"
            :show-header="false"
            :on-navigate="closeDrawer"
            link-classes="font-semibold group flex items-center gap-x-3 rounded-md py-2 text-sm leading-6 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700 px-2"
          />
          
          <div v-if="forums.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            No recent forums yet
          </div>
        </div>
      </div>
    </Transition>
  </ClientOnly>
</template>