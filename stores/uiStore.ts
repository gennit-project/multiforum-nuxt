import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { config } from '@/config';
import { useCookie, useRoute, useRouter } from 'nuxt/app';

export type FontSize = 'small' | 'medium' | 'large';
type ThemeMode = 'light' | 'dark';

export const useUIStore = defineStore('ui', () => {
  // State
  const sideNavIsOpen = ref(false);
  const enteredDevelopmentEnvironment = ref(
    config.environment === 'development'
  );
  const fontSize = ref<FontSize>('small');

  // Discussion list states - separate for channel view and sitewide view
  const expandChannelDiscussions = ref(true); // Default expanded for channel view
  const expandSitewideDiscussions = ref(false); // Default collapsed for sitewide view
  const selectedChannelDiscussionId = ref('');
  const selectedChannelDiscussionTitle = ref('');

  // Theme state
  const themeMode = ref<ThemeMode>('dark');
  const systemThemeIsDark = ref(false); // Kept for backward compatibility

  // Initialize theme from cookie/localStorage on client side - default to dark mode
  if (import.meta.client) {
    const themeCookie = useCookie('theme', { default: () => 'dark' });
    const localTheme = localStorage.getItem('theme');

    // Set initial theme preference - default to dark
    if (localTheme && ['light', 'dark'].includes(localTheme)) {
      themeMode.value = localTheme as ThemeMode;
      themeCookie.value = localTheme;
    } else if (
      themeCookie.value &&
      ['light', 'dark'].includes(themeCookie.value)
    ) {
      themeMode.value = themeCookie.value as ThemeMode;
    } else {
      // Default to dark mode if nothing is set
      themeMode.value = 'dark';
      themeCookie.value = 'dark';
      localStorage.setItem('theme', 'dark');
    }

    // Check if system prefers dark mode - for backward compatibility
    systemThemeIsDark.value = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    // Listen for system preference changes
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        systemThemeIsDark.value = e.matches;
      });
  }

  // Computed theme value (light or dark)
  const theme = computed(() => themeMode.value);

  // Apply theme class to HTML element
  if (import.meta.client) {
    watch(
      theme,
      (newTheme) => {
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      { immediate: true }
    );
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

  function setTheme(mode: 'light' | 'dark') {
    const route = useRoute();
    const router = useRouter();

    // Capture current query params before theme change
    const currentQuery = { ...route.query };

    // Update theme - only allow 'light' or 'dark'
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
          query: currentQuery,
        });
      }
    }
  }

  function toggleExpandDiscussions(
    expand?: boolean,
    isChannelView: boolean = false
  ) {
    if (isChannelView) {
      // For channel view
      if (expand !== undefined) {
        expandChannelDiscussions.value = expand;
      } else {
        expandChannelDiscussions.value = !expandChannelDiscussions.value;
      }
    } else {
      // For sitewide view
      if (expand !== undefined) {
        expandSitewideDiscussions.value = expand;
      } else {
        expandSitewideDiscussions.value = !expandSitewideDiscussions.value;
      }
    }
  }

  function setSelectedChannelDiscussionSelection(params: {
    discussionId: string;
    title: string;
  }) {
    selectedChannelDiscussionId.value = params.discussionId;
    selectedChannelDiscussionTitle.value = params.title;
  }

  function clearSelectedChannelDiscussion() {
    selectedChannelDiscussionId.value = '';
    selectedChannelDiscussionTitle.value = '';
  }

  return {
    // State
    sideNavIsOpen,
    enteredDevelopmentEnvironment,
    fontSize,
    theme,
    themeMode,
    expandChannelDiscussions,
    expandSitewideDiscussions,
    selectedChannelDiscussionId,
    selectedChannelDiscussionTitle,

    // Actions
    setSideNavIsOpen,
    setEnteredDevelopmentEnvironment,
    setFontSize,
    setTheme,
    toggleExpandDiscussions,
    setSelectedChannelDiscussionSelection,
    clearSelectedChannelDiscussion,
  };
});
