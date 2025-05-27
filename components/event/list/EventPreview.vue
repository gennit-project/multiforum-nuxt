<script setup lang="ts">
import {
  Dialog as TailwindDialog,
  DialogOverlay,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import XIcon from "@/components/icons/XmarkIcon.vue";
import EventDetail from "../detail/EventDetail.vue";

defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  topLayer: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["closePreview"]);
</script>

<template>
  <client-only>
  <TransitionRoot as="template" :show="isOpen">
    <TailwindDialog
      as="div"
      :class="[topLayer ? 'z-50' : 'z-40']"
      class="fixed inset-0 overflow-hidden z-20"
      @close="$emit('closePreview')"
    >
      <div class="absolute inset-0 overflow-hidden">
        <DialogOverlay class="absolute inset-0" />

        <div class="fixed inset-y-0 left-0 max-w-full flex">
          <TransitionChild
            as="template"
            enter="transform transition ease-in-out duration-100 sm:duration-100"
            enter-from="-translate-x-full"
            enter-to="translate-x-0"
            leave="transform transition ease-in-out duration-100 sm:duration-100"
            leave-from="translate-x-0"
            leave-to="-translate-x-full"
          >
            <div class="w-screen max-w-2xl">
              <div
                class="h-full divide-y divide-gray-200 flex flex-col bg-white dark:bg-gray-800 dark:text-gray-200 shadow-xl"
              >
                <div
                  class="min-h-0 flex-1 flex flex-col py-6 overflow-y-scroll bg-white dark:bg-gray-800 dark:text-gray-200"
                >
<<<<<<< HEAD
                  <div
                    class="flex min-h-0 flex-1 flex-col overflow-y-scroll bg-white py-6 dark:bg-gray-800 dark:text-gray-200"
                  >
                    <div>
                      <div class="flex items-start justify-between">
                        <div class="flex h-7 items-center">
                          <button
                            class="ml-8 rounded-full bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-900 dark:text-gray-200"
                            type="button"
                            @click="$emit('closePreview')"
                          >
                            <span class="sr-only">Close panel</span>
                            <XIcon
                              aria-hidden="true"
                              class="h-6 w-6"
                            />
                          </button>
                        </div>
=======
                  <div>
                    <div class="flex items-start justify-between">
                      <div class="h-7 flex items-center">
                        <button
                          type="button"
                          class="bg-white dark:bg-gray-900 ml-8 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200"
                          @click="$emit('closePreview')"
                        >
                          <span class="sr-only">Close panel</span>
                          <XIcon class="h-6 w-6" aria-hidden="true" />
                        </button>
>>>>>>> parent of 666ae3d (Use automated formatting tools)
                      </div>
                    </div>
                  </div>
<<<<<<< HEAD
                  <div class="flex flex-shrink-0 justify-end px-4 py-4">
                    <button
                      class="hover:bg-gray-50 rounded-full border bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2 dark:bg-gray-900 dark:text-gray-200"
                      type="button"
                      @click="$emit('closePreview')"
                    >
                      Close
                    </button>
=======
                  <div class="relative flex-1" data-testid="event-preview">
                    <EventDetail :compact-mode="true" :show-comments="false" />
>>>>>>> parent of 666ae3d (Use automated formatting tools)
                  </div>
                </div>
                <div class="flex-shrink-0 px-4 py-4 flex justify-end">
                  <button
                    type="button"
                    class="bg-white dark:bg-gray-900 py-2 px-4 border rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
                    @click="$emit('closePreview')"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </TailwindDialog>
  </TransitionRoot>
</client-only>
</template>
