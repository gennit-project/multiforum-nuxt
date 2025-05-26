<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/vue'

interface Props {
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
  disabled?: boolean
  contentClass?: string
  closeOnClick?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'bottom-start',
  disabled: false,
  contentClass: '',
  closeOnClick: true
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'open': []
  'close': []
}>()

const isOpen = ref(false)
const reference = ref<HTMLElement>()
const floating = ref<HTMLElement>()

const { floatingStyles } = useFloating(reference, floating, {
  placement: props.placement,
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(4),
    flip(),
    shift({ padding: 8 })
  ]
})

const toggleDropdown = () => {
  if (props.disabled) return
  
  isOpen.value = !isOpen.value
  emit('update:open', isOpen.value)
  
  if (isOpen.value) {
    emit('open')
  } else {
    emit('close')
  }
}

const closeDropdown = () => {
  isOpen.value = false
  emit('update:open', false)
  emit('close')
}

const handleClickOutside = (event: MouseEvent) => {
  if (!isOpen.value) return
  
  const target = event.target as Node
  if (
    reference.value?.contains(target) ||
    floating.value?.contains(target)
  ) {
    return
  }
  
  closeDropdown()
}

const handleContentClick = () => {
  if (props.closeOnClick) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="relative inline-block">
    <div
      ref="reference"
      @click="toggleDropdown"
    >
      <slot name="trigger" :is-open="isOpen" />
    </div>

    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="floating"
        :style="floatingStyles"
        class="z-50 min-w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700"
        :class="contentClass"
        @click="handleContentClick"
      >
        <div class="py-1">
          <slot name="content" :close="closeDropdown" />
        </div>
      </div>
    </Teleport>
  </div>
</template>