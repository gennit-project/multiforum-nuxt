<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFloating, autoUpdate, offset, flip, shift, arrow } from '@floating-ui/vue'

interface Props {
  content?: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  disabled?: boolean
  contentClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  placement: 'bottom',
  disabled: false,
  contentClass: ''
})

const isOpen = ref(false)
const reference = ref<HTMLElement>()
const floating = ref<HTMLElement>()
const arrowRef = ref<HTMLElement>()

const { floatingStyles, middlewareData } = useFloating(reference, floating, {
  placement: props.placement,
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(8),
    flip(),
    shift({ padding: 8 }),
    arrow({ element: arrowRef })
  ]
})

const arrowStyles = computed(() => {
  const arrowData = middlewareData.value.arrow
  if (!arrowData) return {}

  const { x, y } = arrowData
  const staticSide = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right',
  }[props.placement.split('-')[0]]

  return {
    left: x != null ? `${x}px` : '',
    top: y != null ? `${y}px` : '',
    right: '',
    bottom: '',
    [staticSide!]: '-4px',
  }
})

const showTooltip = () => {
  if (!props.disabled) {
    isOpen.value = true
  }
}

const hideTooltip = () => {
  isOpen.value = false
}
</script>

<template>
  <div class="inline-block">
    <div
      ref="reference"
      @mouseenter="showTooltip"
      @mouseleave="hideTooltip"
      @focus="showTooltip"
      @blur="hideTooltip"
    >
      <slot />
    </div>

    <Teleport to="body">
      <div
        v-if="isOpen && (content || $slots.tooltip)"
        ref="floating"
        :style="floatingStyles"
        class="z-50 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg dark:bg-gray-700"
        :class="contentClass"
        role="tooltip"
      >
        <slot name="tooltip">
          {{ content }}
        </slot>
        
        <!-- Arrow -->
        <div
          ref="arrowRef"
          :style="arrowStyles"
          class="absolute h-2 w-2 rotate-45 bg-gray-900 dark:bg-gray-700"
        />
      </div>
    </Teleport>
  </div>
</template>