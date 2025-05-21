<script setup lang="ts">
  import {
    Dialog as DialogComponent,
    DialogOverlay,
    TransitionChild,
    TransitionRoot,
    DialogTitle,
  } from "@headlessui/vue";
  import XIcon from "@/components/icons/XmarkIcon.vue";

  defineProps({
    isOpen: {
      type: Boolean,
      required: true,
    },
    header: {
      type: String,
      default: "",
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
    <TransitionRoot
      as="template"
      :show="isOpen"
    >
      <DialogComponent
        as="div"
        class="fixed inset-0 overflow-hidden"
        :class="[topLayer ? 'z-30' : 'z-20']"
        @close="$emit('closePreview')"
      >
        <div class="absolute inset-0 overflow-hidden">
          <DialogOverlay class="absolute inset-0" />

          <div class="fixed inset-y-0 left-0 flex max-w-full">
            <TransitionChild
              as="template"
              enter="transform transition ease-in-out duration-100 sm:duration-100"
              enter-from="-translate-x-full"
              enter-to="translate-x-0"
              leave="transform transition ease-in-out duration-100 sm:duration-100"
              leave-from="translate-x-0"
              leave-to="-translate-x-full"
            >
              <div class="w-screen max-w-3xl">
                <div class="flex h-full flex-col divide-y divide-gray-200 shadow-xl">
                  <div
                    class="flex min-h-0 flex-1 flex-col overflow-auto bg-white px-8 py-2 dark:bg-gray-800 dark:text-gray-200"
                  >
                    <div>
                      <div class="flex items-center gap-4">
                        <div class="ml-3 flex h-7 items-center">
                          <button
                            class="rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200"
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
                        <DialogTitle
                          class="my-3 text-lg font-medium text-gray-900 dark:text-gray-200"
                        >
                          {{ header }}
                        </DialogTitle>
                      </div>
                    </div>
                    <slot />
                  </div>
                </div>
              </div>
            </TransitionChild>
          </div>
        </div>
      </DialogComponent>
    </TransitionRoot>
  </client-only>
</template>
