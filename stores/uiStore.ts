import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { config } from '@/config';
import { useCookie, useRoute, useRouter, useHead } from 'nuxt/app';

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
  const selectedChannelEventId = ref('');
  const selectedChannelEventTitle = ref('');
  const selectedIssueNumber = ref<number | null>(null);
  const selectedIssueTitle = ref('');
  const selectedIssueChannelId = ref('');

  // Theme state — this store is the single source of truth for the app's theme.
  const themeMode = ref<ThemeMode>('dark');
  const systemThemeIsDark = ref(false); // Kept for backward compatibility

  // Server: read the persisted theme from the cookie so server-rendered markup
  // matches the user's preference (no light-mode flash on load). useCookie is
  // only called inside the server/client guards so plain unit tests — which run
  // without a Nuxt context — fall back to the default instead of throwing.
  if (import.meta.server) {
    const themeCookie = useCookie<string>('theme', { default: () => 'dark' });
    if (themeCookie.value === 'light' || themeCookie.value === 'dark') {
      themeMode.value = themeCookie.value;
    }
  }

  // Client: localStorage takes precedence and is reconciled into the cookie;
  // also track the OS preference for backward compatibility.
  if (import.meta.client) {
    const themeCookie = useCookie<string>('theme', { default: () => 'dark' });
    const localTheme = localStorage.getItem('theme');
    if (localTheme === 'light' || localTheme === 'dark') {
      themeMode.value = localTheme;
      themeCookie.value = localTheme;
    } else if (
      themeCookie.value === 'light' ||
      themeCookie.value === 'dark'
    ) {
      themeMode.value = themeCookie.value;
      localStorage.setItem('theme', themeMode.value);
    } else {
      // Nothing stored yet — seed cookie + localStorage so it persists.
      themeCookie.value = themeMode.value;
      localStorage.setItem('theme', themeMode.value);
    }

    systemThemeIsDark.value = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        systemThemeIsDark.value = e.matches;
      });
  }

  // Computed theme value (light or dark)
  const theme = computed(() => themeMode.value);

  // Server: emit the initial <html> class so server-rendered markup already
  // matches the user's theme (eliminates the hydration flash).
  if (import.meta.server) {
    useHead({
      htmlAttrs: {
        class: theme.value === 'dark' ? 'dark' : '',
      },
    });
  }

  // Client: keep the <html> class in sync as the theme changes at runtime.
  if (import.meta.client) {
    watch(
      theme,
      (newTheme) => {
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
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

  function setSelectedChannelEventSelection(params: {
    eventId: string;
    title: string;
  }) {
    selectedChannelEventId.value = params.eventId;
    selectedChannelEventTitle.value = params.title;
  }

  function clearSelectedChannelEventSelection() {
    selectedChannelEventId.value = '';
    selectedChannelEventTitle.value = '';
  }

  function setSelectedIssueSelection(params: {
    issueNumber: number;
    title: string;
    channelId: string;
  }) {
    selectedIssueNumber.value = params.issueNumber;
    selectedIssueTitle.value = params.title;
    selectedIssueChannelId.value = params.channelId;
  }

  function clearSelectedIssueSelection() {
    selectedIssueNumber.value = null;
    selectedIssueTitle.value = '';
    selectedIssueChannelId.value = '';
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
    selectedChannelEventId,
    selectedChannelEventTitle,
    selectedIssueNumber,
    selectedIssueTitle,
    selectedIssueChannelId,

    // Actions
    setSideNavIsOpen,
    setEnteredDevelopmentEnvironment,
    setFontSize,
    setTheme,
    toggleExpandDiscussions,
    setSelectedChannelDiscussionSelection,
    clearSelectedChannelDiscussion,
    setSelectedChannelEventSelection,
    clearSelectedChannelEventSelection,
    setSelectedIssueSelection,
    clearSelectedIssueSelection,
  };
});
