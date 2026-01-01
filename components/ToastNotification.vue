<script setup lang="ts">
import { useToastStore } from '@/stores/toastStore';

const toastStore = useToastStore();
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 space-y-2">
      <TransitionGroup
        enter-active-class="transition ease-out duration-300"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0"
      >
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="flex min-w-[200px] max-w-[420px] items-center justify-between gap-3 rounded-lg bg-gray-900 px-4 py-3 text-white shadow-lg"
          :class="{
            'bg-gray-900': toast.type === 'info' || !toast.type,
            'bg-green-700': toast.type === 'success',
            'bg-red-700': toast.type === 'error',
          }"
        >
          <div class="flex flex-1 items-center gap-3">
            <span class="text-sm font-medium">{{ toast.message }}</span>
            <button
              v-if="toast.action"
              type="button"
              class="font-semibold text-xs text-blue-200 underline underline-offset-2 hover:text-blue-100"
              @click="
                toast.action?.onClick();
                toastStore.dismissToast(toast.id);
              "
            >
              {{ toast.action.label }}
            </button>
          </div>
          <button
            type="button"
            class="flex-shrink-0 text-gray-300 transition-colors hover:text-white"
            aria-label="Dismiss notification"
            @click="toastStore.dismissToast(toast.id)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="h-5 w-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
