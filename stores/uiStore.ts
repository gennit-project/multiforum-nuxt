import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { config } from '@/config';
import { useCookie, useRoute, useRouter } from 'nuxt/app';

export type FontSize = 'small' | 'medium' | 'large';
export type ThemeMode = 'light' | 'dark' | 'system';

export const useUIStore = defineStore('ui', () => {
  // State
  const sideNavIsOpen = ref(false);
  const enteredDevelopmentEnvironment = ref(config.environment === "development");
  const fontSize = ref<FontSize>('small');
  
  // Discussion list states
  const expandAllDiscussions = ref(false);
  
  // Theme state
  const themeMode = ref<ThemeMode>('system');
  const systemThemeIsDark = ref(false);
  
  // Initialize theme from cookie/localStorage on client side
  if (import.meta.client) {
    const themeCookie = useCookie('theme', { default: () => 'system' });
    const localTheme = localStorage.getItem('theme');
    
    // Set initial theme preference
    if (localTheme && ['light', 'dark', 'system'].includes(localTheme)) {
      themeMode.value = localTheme as ThemeMode;
      themeCookie.value = localTheme;
    } else if (themeCookie.value && ['light', 'dark', 'system'].includes(themeCookie.value)) {
      themeMode.value = themeCookie.value as ThemeMode;
    }
    
    // Check if system prefers dark mode
    systemThemeIsDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        systemThemeIsDark.value = e.matches;
      });
  }
  
  // Computed theme value (light or dark)
  const theme = computed(() => {
    if (themeMode.value === 'system') {
      return systemThemeIsDark.value ? 'dark' : 'light';
    }
    return themeMode.value;
  });
  
  // Apply theme class to HTML element
  if (import.meta.client) {
    watch(theme, (newTheme) => {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, { immediate: true });
  }
  
  // Actions
  function setSideNavIsOpen(status: boolean) {
    // Necessary to prevent a bug in which the event list
    // event listeners interfere with navigation to the links
    // in the side nav. This state is used to turn off the 
    // event listeners in the event list when the side nav is open.
    sideNavIsOpen.value = status;
  }
  
  function setEnteredDevelopmentEnvironment(status: boolean) {
    enteredDevelopmentEnvironment.value = status;
  }

  function setFontSize(size: FontSize) {
    // Only update if it's actually changing to avoid unnecessary rerenders
    if (size !== fontSize.value) {
      fontSize.value = size;
    }
  }
  
  function setTheme(mode: ThemeMode) {
    const route = useRoute();
    const router = useRouter();
    
    // Capture current query params before theme change
    const currentQuery = { ...route.query };
    
    // Update theme
    themeMode.value = mode;
    
    // Save to cookie and localStorage
    if (import.meta.client) {
      localStorage.setItem('theme', mode);
      const themeCookie = useCookie('theme');
      themeCookie.value = mode;
      
      // Preserve query params
      if (Object.keys(currentQuery).length) {
        router.replace({ 
          path: route.path,
          query: currentQuery 
        });
      }
    }
  }
  
  function toggleExpandDiscussions(expand?: boolean) {
    if (expand !== undefined) {
      expandAllDiscussions.value = expand;
    } else {
      expandAllDiscussions.value = !expandAllDiscussions.value;
    }
  }

  return {
    // State
    sideNavIsOpen,
    enteredDevelopmentEnvironment,
    fontSize,
    theme,
    themeMode,
    expandAllDiscussions,
    
    // Actions
    setSideNavIsOpen,
    setEnteredDevelopmentEnvironment,
    setFontSize,
    setTheme,
    toggleExpandDiscussions
  };
});