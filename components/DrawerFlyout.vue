<script setup lang="ts">
  import { ref, type VNodeRef } from "vue";
  import {
    Dialog,
    DialogOverlay,
    DialogPanel,
    TransitionChild,
    TransitionRoot,
  } from "@headlessui/vue";
  import XIcon from "@/components/icons/XmarkIcon.vue";
  // Removed useDisplay from vuetify

  const props = defineProps({
    isOpen: {
      type: Boolean,
      required: true,
    },
    openFromLeft: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "",
    },
  });

  const emit = defineEmits(["closePreview"]);

  const cancelButtonRef = ref<VNodeRef | null>(null);
  // Use a simple window width check instead of vuetify's useDisplay
  const smAndDown = ref(false);
  if (import.meta.client) {
    smAndDown.value = window.innerWidth < 640;
    window.addEventListener('resize', () => {
      smAndDown.value = window.innerWidth < 640;
    });
  }

  function closePreview() {
    emit("closePreview");
  }
</script>

<template>
  <client-only>
    <TransitionRoot
      as="template"
      :show="props.isOpen"
    >
      <Dialog
        as="div"
        class="fixed inset-y-0 z-20 overflow-hidden"
        :class="props.openFromLeft ? 'left-0' : 'right-0'"
        :initial-focus="cancelButtonRef"
        @close="closePreview"
      >
        <div class="absolute inset-0 overflow-hidden">
          <DialogOverlay
            class="absolute inset-y-0 bg-gray-900 bg-opacity-50"
            :class="props.openFromLeft ? 'right-0' : 'left-0'"
          />
          <div
            class="fixed inset-y-0 flex max-w-full"
            :class="props.openFromLeft ? 'left-0 pr-10' : 'right-0 pl-10'"
          >
            <TransitionChild
              as="template"
              enter="transform transition ease-in-out duration-100 sm:duration-100"
              :enter-from="props.openFromLeft ? '-translate-x-full' : 'translate-x-full'"
              enter-to="translate-x-0"
              leave="transform transition ease-in-out duration-100 sm:duration-100"
              leave-from="translate-x-0"
              :leave-to="props.openFromLeft ? '-translate-x-full' : 'translate-x-full'"
            >
              <DialogPanel class="pointer-events-auto w-screen max-w-lg">
                <div
                  class="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl dark:bg-gray-900 dark:text-white"
                >
                  <div class="flex min-h-0 flex-1 flex-col overflow-y-scroll py-6">
                    <div>
                      <div class="flex items-start justify-between">
                        <div class="flex h-7 items-center">
                          <button
                            :ref="cancelButtonRef"
                            class="rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                            :class="smAndDown ? 'ml-2' : 'ml-4'"
                            type="button"
                            @click="closePreview"
                          >
                            <span
                              class="sr-only"
                              data-testid="close-drawer-top-button"
                            >
                              Close panel
                            </span>
                            <XIcon
                              aria-hidden="true"
                              class="h-6 w-6"
                            />
                          </button>
                          <h1 class="mx-2 mt-2 text-lg">{{ props.title }}</h1>
                        </div>
                      </div>
                    </div>
                    <div
                      class="relative flex-1"
                      :class="[smAndDown ? 'm-2' : 'm-4']"
                    >
                      <slot />
                    </div>
                  </div>
                  <div class="flex flex-shrink-0 justify-end px-4 py-4">
                    <button
                      class="hover:bg-gray-50 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200"
                      data-testid="close-drawer-bottom-button"
                      type="button"
                      @click="closePreview"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </client-only>
</template>
