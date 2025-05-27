<script setup lang="ts">
<<<<<<< HEAD
  import { ref, type VNodeRef } from "vue";
  import {
    Dialog,
    DialogOverlay,
    DialogPanel,
    TransitionChild,
    TransitionRoot,
  } from "@headlessui/vue";
  import XIcon from "@/components/icons/XmarkIcon.vue";
=======
import { ref, type VNodeRef } from "vue";
import {
  Dialog,
  DialogOverlay,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import XIcon from "@/components/icons/XmarkIcon.vue";
import { useDisplay } from "vuetify";
>>>>>>> parent of 666ae3d (Use automated formatting tools)

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

<<<<<<< HEAD
  const cancelButtonRef = ref<VNodeRef | null>(null);
  const smAndDown = ref(false);
  if (import.meta.client) {
    smAndDown.value = window.innerWidth < 640;
    window.addEventListener("resize", () => {
      smAndDown.value = window.innerWidth < 640;
    });
  }
=======
const cancelButtonRef = ref<VNodeRef | null>(null);
const { smAndDown } = useDisplay();
>>>>>>> parent of 666ae3d (Use automated formatting tools)

function closePreview() {
  emit("closePreview");
}
</script>

<template>
  <client-only>
  <TransitionRoot as="template" :show="props.isOpen">
    <Dialog
      as="div"
      class="fixed inset-y-0 overflow-hidden z-20"
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
          class="fixed inset-y-0 max-w-full flex"
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
<<<<<<< HEAD
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
=======
            <DialogPanel class="pointer-events-auto w-screen max-w-lg">
              <div class="h-full divide-y divide-gray-200 flex flex-col shadow-xl bg-white dark:bg-gray-900 dark:text-white">
                <div class="min-h-0 flex-1 flex flex-col py-6 overflow-y-scroll">
                  <div>
                    <div class="flex items-start justify-between">
                      <div class="h-7 flex items-center">
                        <button
                          :ref="cancelButtonRef"
                          type="button"
                          :class="smAndDown ? 'ml-2' : 'ml-4'"
                          class="rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          @click="closePreview"
                        >
                          <span data-testid="close-drawer-top-button" class="sr-only">
                            Close panel
                          </span>
                          <XIcon class="h-6 w-6" aria-hidden="true" />
                        </button>
                        <h1 class="text-lg mt-2 mx-2">{{ props.title }}</h1>
>>>>>>> parent of 666ae3d (Use automated formatting tools)
                      </div>
                    </div>
                  </div>
<<<<<<< HEAD
                  <div class="flex flex-shrink-0 justify-end px-4 py-4">
                    <button
                      class="hover:bg-gray-50 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200"
                      data-testid="close-drawer-bottom-button"
                      type="button"
                      @click="closePreview"
                    >
                      Close
                    </button>
=======
                  <div class="relative flex-1" :class="[smAndDown ? 'm-2' : 'm-4']">
                    <slot />
>>>>>>> parent of 666ae3d (Use automated formatting tools)
                  </div>
                </div>
                <div class="flex-shrink-0 px-4 py-4 flex justify-end">
                  <button
                    type="button"
                    data-testid="close-drawer-bottom-button"
                    class="py-2 px-4 border border-gray-300 dark:bg-gray-700 dark:border-gray-700 dark:text-gray-200 rounded-full shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
