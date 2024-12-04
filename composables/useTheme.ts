// composables/useTheme.ts
import { computed, ref, onMounted, watch } from "vue";
import { useCookie } from "nuxt/app";

export const useTheme = () => {
  const themeCookie = useCookie("theme", {
    default: () => "system", // Change default to system
  });
  
  const currentThemeValue = ref(themeCookie.value);
  const systemThemeIsDark = ref(true); // Default to dark during SSR
  
  // Initialize system theme detection
  if (import.meta.client) {
    // Check localStorage on init
    const localTheme = localStorage.getItem("theme");
    if (localTheme) {
      currentThemeValue.value = localTheme;
      themeCookie.value = localTheme;
    }

    // Initialize system theme detection
    systemThemeIsDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        systemThemeIsDark.value = e.matches;
      });
  }

  const setTheme = (newTheme: string) => {
    currentThemeValue.value = newTheme;
    themeCookie.value = newTheme;
    if (import.meta.client) {
      localStorage.setItem("theme", newTheme);
    }
  };

  const computedTheme = computed(() => {
    if (currentThemeValue.value === 'system') {
      return systemThemeIsDark.value ? 'dark' : 'light';
    }
    return currentThemeValue.value;
  });

  // Apply theme class during SSR and client
  if (import.meta.server) {
    useHead({
      htmlAttrs: {
        class: computedTheme.value === 'dark' ? 'dark' : ''
      }
    });
  }

  // Watch for theme changes and apply class to html element
  if (import.meta.client) {
    watch(computedTheme, (newTheme) => {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, { immediate: true });
  }

  return {
    theme: computedTheme,
    setTheme,
  };
};