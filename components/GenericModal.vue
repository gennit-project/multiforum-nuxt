<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import ErrorBanner from "@/components/ErrorBanner.vue";

<<<<<<< HEAD
  defineProps({
    dataTestid: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      required: true,
      default: "Are you sure?",
    },
    highlightColor: {
      type: String,
      default: "yellow",
    },
    body: {
      type: String,
      required: false,
      default: "",
    },
    open: {
      type: Boolean,
      default: false,
    },
    primaryButtonText: {
      type: String,
      default: "Delete",
    },
    secondaryButtonText: {
      type: String,
      default: "Cancel",
    },
    loading: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
    primaryButtonDisabled: {
      type: Boolean,
      default: false,
    },
  });
=======
defineProps({
  dataTestid: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    required: true,
    default: "Are you sure?",
  },
  highlightColor: {
    type: String,
    default: "yellow",
  },
  body: {
    type: String,
    required: true,
    default: "",
  },
  open: {
    type: Boolean,
    default: false,
  },
  primaryButtonText: {
    type: String,
    default: "Delete",
  },
  secondaryButtonText: {
    type: String,
    default: "Cancel",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: "",
  },
  primaryButtonDisabled: {
    type: Boolean,
    default: false,
  },
});
>>>>>>> parent of 666ae3d (Use automated formatting tools)

const emit = defineEmits(["close", "primaryButtonClick"]);
</script>

<template>
  <client-only>
    <TransitionRoot as="template" :show="open">
      <Dialog
        :data-testid="dataTestid"
        as="div"
        class="relative"
        style="z-index: 1000"
        @close="emit('close')"
      >
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div
            class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          />
        </TransitionChild>

        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div
            class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
          >
            <TransitionChild
              as="template"
              enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel
                class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
              >
                <!-- Header Area with fixed height -->
                <div class="flex-none px-4 pt-5 pb-2">
                  <div class="flex items-center space-x-4">
                    <div
                      :class="[
                        highlightColor === 'red'
                          ? `bg-red-100 dark:bg-red-transparent`
                          : `bg-yellow-100 dark:bg-yellow-transparent`,
                      ]"
                      class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10"
                    >
                      <slot name="icon" />
                    </div>
                    <DialogTitle
                      as="h3"
                      class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                    >
                      {{ title }}
                    </DialogTitle>
                  </div>
                </div>

                <!-- Main Content Area with flex-grow and overflow -->
                <div class="flex flex-col flex-grow px-4 overflow-hidden">
                  <p class="flex-none text-sm text-gray-500 dark:text-gray-300">
                    {{ body }}
                  </p>
                  <div class="flex-grow overflow-y-auto mt-2">
                    <slot name="content" />
                  </div>
                  <ErrorBanner
                    v-if="error"
                    class="flex-none mt-5"
                    :text="error"
                  />
                </div>
                <!-- Footer Area with fixed height -->
                <div
                  class="flex-none px-4 py-4 sm:flex sm:flex-row-reverse"
                >
                  <button
                    type="button"
                    :data-testid="`${dataTestid}-primary-button`"
                    :disabled="primaryButtonDisabled"
                    class="max-h-10"
                    :class="[
                      !primaryButtonDisabled
                        ? `border-transparent border bg-orange-600 text-white hover:bg-orange-500`
                        : 'bg-gray-300 text-black dark:bg-gray-700 dark:text-gray-200',
<<<<<<< HEAD
                      `inline-flex w-full justify-center rounded-full px-4 py-2 text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`,
=======
                      `inline-flex w-full justify-center rounded-full px-4 py-2 text-base font-medium shadow-sm  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`,
>>>>>>> parent of 666ae3d (Use automated formatting tools)
                    ]"
                    @click="emit('primaryButtonClick')"
                  >
                    {{ loading ? "Saving..." : primaryButtonText }}
                  </button>
                  <button
                    ref="cancelButtonRef"
<<<<<<< HEAD
                    class="hover:bg-gray-50 inline-flex w-full justify-center rounded-full border border-gray-300 px-4 py-2 text-base font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:text-gray-200 sm:mt-0 sm:w-auto sm:text-sm"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
                    type="button"
                    class="hover:bg-gray-50 inline-flex w-full justify-center rounded-full border border-gray-300 px-4 py-2 text-base font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-gray-200 sm:mt-0 sm:w-auto sm:text-sm"
                    @click="emit('close')"
                  >
                    {{ secondaryButtonText }}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </client-only>
</template>
