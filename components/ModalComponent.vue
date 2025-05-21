<script setup lang="ts">
  import {
    Dialog,
    DialogPanel,
    DialogTitle,
    TransitionChild,
    TransitionRoot,
  } from "@headlessui/vue";
  import CheckIcon from "@/components/icons/CheckIcon.vue";

  const props = defineProps({
    primaryButtonText: {
      type: String,
      required: false,
      default: "",
    },
    show: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    useCustomButtons: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits(["close", "primaryButtonClick", "secondaryButtonClick"]);
</script>

<template>
  <client-only>
    <TransitionRoot
      as="template"
      :show="props.show"
      @click="emit('close')"
    >
      <Dialog
        as="div"
        class="relative z-10"
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
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0">
            <TransitionChild
              as="template"
              enter="ease-out duration-200"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel
                class="relative transform overflow-hidden rounded-lg px-4 pb-4 pt-5 text-left shadow-xl transition-all"
              >
                <div>
                  <div
                    class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100"
                  >
                    <slot name="icon">
                      <CheckIcon
                        aria-hidden="true"
                        class="h-6 w-6 text-green-600"
                      />
                    </slot>
                  </div>
                  <div class="mt-3 sm:mt-5">
                    <DialogTitle
                      as="h3"
                      class="text-center text-lg font-medium leading-6 text-gray-900"
                    >
                      {{ props.title }}
                    </DialogTitle>
                    <div class="mt-2">
                      <slot name="content" />
                    </div>
                  </div>
                </div>
                <div
                  v-if="!props.useCustomButtons"
                  class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3"
                >
                  <button
                    class="border-transparent bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 px-4py-2 inline-flex w-full justify-center rounded-full border border-black text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                    type="button"
                    @click="
                      () => {
                        emit('close');
                        emit('primaryButtonClick');
                      }
                    "
                  >
                    {{ props.primaryButtonText ? props.primaryButtonText : "Close" }}
                  </button>
                  <slot name="secondaryButton">
                    <button
                      class="hover:bg-gray-50 focus:ring-indigo-500 mt-3 inline-flex w-full justify-center rounded-full border border-black px-4 py-2 text-base font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                      type="button"
                      @click="
                        () => {
                          emit('secondaryButtonClick');
                          emit('close');
                        }
                      "
                    >
                      Cancel
                    </button>
                  </slot>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </client-only>
</template>
