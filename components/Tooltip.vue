<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/vue';
import type { Placement } from '@floating-ui/vue';

// Registered name satisfies vue/multi-word-component-names (the file is still
// auto-imported as <Tooltip> by Nuxt). Mirrors the Table.vue convention.
defineOptions({ name: 'TooltipComponent' });

// Hover/focus tooltip built on @floating-ui/vue (replaces Vuetify's v-tooltip).
// The trigger goes in the `activator` slot and binds the provided handlers; the
// default slot is the tooltip content, teleported to <body> and positioned.
const props = defineProps({
  // Accepts Vuetify-style locations (top/bottom/left/right/start/end).
  location: {
    type: String,
    default: 'top',
  },
  ariaLabel: {
    type: String,
    default: '',
  },
});

defineSlots<{
  activator?: (slotProps: { props: Record<string, unknown> }) => unknown;
  default?: () => unknown;
}>();

const LOCATION_TO_PLACEMENT: Record<string, Placement> = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  start: 'left',
  end: 'right',
};

const isOpen = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const floatingRef = ref<HTMLElement | null>(null);

const placement = computed<Placement>(
  () => LOCATION_TO_PLACEMENT[props.location] ?? 'top'
);

const { floatingStyles } = useFloating(triggerRef, floatingRef, {
  placement,
  strategy: 'fixed',
  middleware: [offset(6), flip(), shift({ padding: 8 })],
  whileElementsMounted: autoUpdate,
});

const show = () => {
  isOpen.value = true;
};
const hide = () => {
  isOpen.value = false;
};

// Bound to the trigger element by the activator slot consumer.
const activatorProps = {
  onMouseenter: show,
  onMouseleave: hide,
  onFocusin: show,
  onFocusout: hide,
};
</script>

<template>
  <div ref="triggerRef" class="inline-block">
    <slot name="activator" :props="activatorProps" />
  </div>
  <client-only>
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="floatingRef"
        :style="floatingStyles"
        role="tooltip"
        :aria-label="ariaLabel || undefined"
        class="z-[10000]"
      >
        <div
          class="custom-tooltip max-w-sm rounded-md border border-[#30363e] bg-black px-3 py-2 text-sm text-white shadow-lg"
        >
          <slot />
        </div>
      </div>
    </Teleport>
  </client-only>
</template>
