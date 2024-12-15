// composables/useIsMobile.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useIsMobile() {
  // Start with true if viewport < 768px
  const isMobile = ref(import.meta.server ? true : window.innerWidth < 768)

  function updateWidth() {
    if (import.meta.client) {
      isMobile.value = window.innerWidth < 768
    }
  }

  onMounted(() => {
    updateWidth()
    window.addEventListener('resize', updateWidth)
  })

  onUnmounted(() => {
    if (import.meta.client) {
      window.removeEventListener('resize', updateWidth)
    }
  })

  return isMobile
}