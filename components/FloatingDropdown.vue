<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/vue';

// Controlled dropdown built on @floating-ui/vue (replaces Vuetify's v-menu).
// The parent owns the open state via v-model; content is teleported to <body>
// so it escapes any overflow-hidden ancestor, and positioned bottom-start with
// flip/shift so it stays on screen.
defineOptions({ inheritAttrs: false });

defineSlots<{
  button?: (props: {
    activatorProps?: Record<string, unknown>;
    class?: unknown;
    onClose: () => void;
  }) => unknown;
  content?: () => unknown;
}>();

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['update:modelValue']);

const triggerRef = ref<HTMLElement | null>(null);
const floatingRef = ref<HTMLElement | null>(null);

const isOpen = computed(() => props.modelValue);

const { floatingStyles } = useFloating(triggerRef, floatingRef, {
  placement: 'bottom-start',
  strategy: 'fixed',
  middleware: [offset(4), flip(), shift({ padding: 8 })],
  whileElementsMounted: autoUpdate,
});

function close() {
  emit('update:modelValue', false);
}
function toggle() {
  emit('update:modelValue', !props.modelValue);
}

// Passed to the button slot; the trigger button calls this to toggle the menu.
const activatorProps = { onClick: toggle };

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node;
  if (
    triggerRef.value?.contains(target) ||
    floatingRef.value?.contains(target)
  ) {
    return;
  }
  close();
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close();
}

watch(isOpen, (open) => {
  if (!import.meta.client) return;
  if (open) {
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
    document.addEventListener('keydown', onKeydown);
  } else {
    document.removeEventListener('pointerdown', onDocumentPointerDown, true);
    document.removeEventListener('keydown', onKeydown);
  }
});

onBeforeUnmount(() => {
  if (!import.meta.client) return;
  document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <client-only>
    <div ref="triggerRef" class="inline-block">
      <slot
        name="button"
        v-bind="{ activatorProps, class: $attrs.class, onClose: close }"
      />
    </div>
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="floatingRef"
        :style="floatingStyles"
        class="z-[10000]"
      >
        <div
          class="overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700"
        >
          <slot name="content" />
        </div>
      </div>
    </Teleport>
    <template #fallback>
      <slot name="button" v-bind="{ class: $attrs.class, onClose: close }" />
    </template>
  </client-only>
</template>
