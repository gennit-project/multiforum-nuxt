<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue';

interface Props {
  watchComments: boolean;
  watchUpdates: boolean;
  commentsLoading?: boolean;
  updatesLoading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  toggleComments: [];
  toggleUpdates: [];
}>();

const baseButtonClasses =
  'inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 transition-colors duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600';
</script>

<template>
  <RequireAuth :full-width="false">
    <template #has-auth>
      <Menu as="div" class="relative inline-block text-left">
        <MenuButton :class="baseButtonClasses">
          <i class="fas fa-bell text-sm" aria-hidden="true" />
          <span>Notifications</span>
          <ChevronDownIcon class="h-4 w-4" aria-hidden="true" />
        </MenuButton>

        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="scale-95 opacity-0"
          enter-to-class="scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="scale-100 opacity-100"
          leave-to-class="scale-95 opacity-0"
        >
          <MenuItems
            class="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-xl border border-gray-200 bg-white p-2 shadow-lg focus:outline-none dark:border-gray-700 dark:bg-gray-800"
          >
            <div class="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Notify Me About
            </div>

            <MenuItem v-slot="{ active }">
              <button
                type="button"
                class="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left"
                :class="active ? 'bg-orange-50 dark:bg-gray-700' : 'bg-transparent'"
                @click="emit('toggleComments')"
              >
                <div class="mt-0.5 flex h-4 w-4 items-center justify-center">
                  <LoadingSpinner
                    v-if="commentsLoading"
                    class="h-4 w-4"
                  />
                  <input
                    v-else
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    :checked="watchComments"
                    tabindex="-1"
                    aria-hidden="true"
                  >
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Comments and replies
                  </div>
                  <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Get notified about new comments on this event and replies to watched comment threads.
                  </div>
                </div>
              </button>
            </MenuItem>

            <MenuItem v-slot="{ active }">
              <button
                type="button"
                class="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left"
                :class="active ? 'bg-orange-50 dark:bg-gray-700' : 'bg-transparent'"
                @click="emit('toggleUpdates')"
              >
                <div class="mt-0.5 flex h-4 w-4 items-center justify-center">
                  <LoadingSpinner
                    v-if="updatesLoading"
                    class="h-4 w-4"
                  />
                  <input
                    v-else
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    :checked="watchUpdates"
                    tabindex="-1"
                    aria-hidden="true"
                  >
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Event updates
                  </div>
                  <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Get notified if this event is canceled or its time, location, or title changes.
                  </div>
                </div>
              </button>
            </MenuItem>
          </MenuItems>
        </transition>
      </Menu>
    </template>

    <template #does-not-have-auth>
      <button type="button" :class="baseButtonClasses">
        <i class="fas fa-bell text-sm" aria-hidden="true" />
        <span>Notifications</span>
        <ChevronDownIcon class="h-4 w-4" aria-hidden="true" />
      </button>
    </template>
  </RequireAuth>
</template>
