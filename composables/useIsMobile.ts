// composables/useIsMobile.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useIsMobile() {
  const isMobile = ref(false)

  function updateWidth() {
    isMobile.value = import.meta.client ? window.innerWidth < 768 : false
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