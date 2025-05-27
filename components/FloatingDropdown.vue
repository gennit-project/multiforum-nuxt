<script setup lang="ts">
<<<<<<< HEAD
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
=======
import { useTheme } from "@/composables/useTheme";

// Set inheritAttrs to false so we can handle attribute inheritance manually
defineOptions({
  inheritAttrs: false,
});

const { theme } = useTheme();
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

function close() {
  emit("update:modelValue", false);
}
</script>

<template>
  <client-only>
    <div>
      <v-menu
        :model-value="props.modelValue"
        :close-on-content-click="false"
        location="bottom"
        @update:model-value="emit('update:modelValue', $event)"
      >
        <template #activator="{ props: activatorProps }">
          <div v-bind="activatorProps">
            <slot name="button" v-bind="{...activatorProps, class: $attrs.class}" @close="close" />
          </div>
        </template>
        <v-card :theme="theme">
          <slot name="content" />
        </v-card>
      </v-menu>
    </div>
    <template #fallback>
      <slot name="button" v-bind="{class: $attrs.class}" @close="close" />
    </template>
  </client-only>
</template>
>>>>>>> parent of 666ae3d (Use automated formatting tools)
