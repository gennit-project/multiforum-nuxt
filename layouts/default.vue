<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useHead, useRoute } from 'nuxt/app';
import { useDisplay } from '@/composables/useDisplay';
import TopNav from '@/components/nav/TopNav.vue';
import SiteSidenav from '@/components/nav/SiteSidenav.vue';
import VerticalIconNav from '@/components/nav/VerticalIconNav.vue';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import DevOverlay from '@/components/nav/DevOverlay.vue';
import ToastNotification from '@/components/ToastNotification.vue';
import AddToListModalHost from '@/components/collection/AddToListModalHost.vue';
import { config } from '@/config';
import { sideNavIsOpenVar, setSideNavIsOpenVar } from '@/cache';

// Composables for separated concerns
import { useTestAuthHelpers } from '@/composables/useTestAuthHelpers';

const isDevRuntime = import.meta.env.DEV;
const isDevelopment = computed(() => config.environment === 'development');
const route = useRoute();
const showFooter = !route.name?.toString().includes('map');
const fontAwesomeStylesheetHref = ref('');
const shouldLoadFontAwesome = computed(() => {
  // Keep the sitewide discussions landing view free of the global Font Awesome
  // stylesheet. The detail preview still uses legacy FA classes, so we keep
  // the stylesheet once a discussion is selected.
  return !(
    route.name === 'discussions' &&
    typeof route.query.selectedDiscussionId !== 'string'
  );
});

if (import.meta.client) {
  watch(
    shouldLoadFontAwesome,
    async (nextValue) => {
      if (!nextValue || fontAwesomeStylesheetHref.value) return;
      const stylesheetModule = await import(
        '@fortawesome/fontawesome-free/css/all.css?url'
      );
      fontAwesomeStylesheetHref.value = stylesheetModule.default;
    },
    { immediate: true }
  );
}

useHead(() => ({
  link: shouldLoadFontAwesome.value && fontAwesomeStylesheetHref.value
    ? [
        {
          key: 'fontawesome-stylesheet',
          rel: 'stylesheet',
          href: fontAwesomeStylesheetHref.value,
        },
      ]
    : [],
}));

// Responsive display
const { lgAndUp, mdAndUp } = useDisplay();

// UI state management
const showUserProfileDropdown = ref(false);
const toggleDropdown = () => setSideNavIsOpenVar(!sideNavIsOpenVar.value);
const toggleUserProfileDropdown = () =>
  (showUserProfileDropdown.value = !showUserProfileDropdown.value);
const closeUserProfileDropdown = () => (showUserProfileDropdown.value = false);

// Test helpers (only in dev/test environments)
const shouldExposeTestHelpers =
  isDevRuntime || config.environment === 'test';

if (shouldExposeTestHelpers) {
  useTestAuthHelpers();
}

// Mark Vuetify overlay container as hidden from accessibility tree when empty
// This prevents axe from flagging it as content outside landmarks
// When an overlay is active, we remove aria-hidden so it remains accessible
onMounted(() => {
  const updateOverlayAccessibility = () => {
    document.querySelectorAll('.v-overlay-container').forEach((container) => {
      // Check if there are any active overlays inside
      const hasActiveOverlay = container.querySelector('.v-overlay--active');
      if (hasActiveOverlay) {
        container.removeAttribute('aria-hidden');
      } else {
        container.setAttribute('aria-hidden', 'true');
      }
    });
  };

  const observer = new MutationObserver(() => {
    updateOverlayAccessibility();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial setup
  updateOverlayAccessibility();
});
</script>

<template>
  <div>
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[1000] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-black focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:bg-gray-800 dark:focus:text-white"
    >
      Skip to main content
    </a>
    <DevOverlay v-if="isDevelopment" />
    <ToastNotification />
    <AddToListModalHost />
    <div class="flex min-h-screen flex-col">
      <div
        class="flex flex-grow list-disc flex-col bg-gray-200 dark:bg-black dark:text-gray-200"
      >
        <header>
          <TopNav
            :show-user-profile-dropdown="showUserProfileDropdown"
            :side-nav-is-open="sideNavIsOpenVar"
            @close-user-profile-dropdown="closeUserProfileDropdown"
            @toggle-dropdown="toggleDropdown"
            @toggle-user-profile-dropdown="toggleUserProfileDropdown"
          />
        </header>

        <div class="relative flex flex-grow flex-col">
          <!-- Vertical Icon Navigation for Large Screens -->
          <nav aria-label="Main navigation">
            <VerticalIconNav />
          </nav>

          <!-- Mobile/Tablet Side Navigation.
               Intentionally NO #fallback slot. A ClientOnly #fallback renders its
               content wrapped in Vue fragment-boundary comment markers on the
               server that the client hydration vdom does not reproduce, causing a
               "server rendered more child nodes than client vdom" mismatch. That
               makes Vue re-render this whole layout column and remove/re-add the
               page content element below (the discussion-page flash). With no
               fallback, ClientOnly renders one placeholder element that matches on
               both sides. -->
          <ClientOnly>
            <nav v-if="!lgAndUp" id="mobile-menu" aria-label="Mobile navigation">
              <SiteSidenav
                :key="`${sideNavIsOpenVar}`"
                :show-dropdown="sideNavIsOpenVar"
                @close="setSideNavIsOpenVar(false)"
              />
            </nav>
          </ClientOnly>

          <main
            id="main-content"
            tabindex="-1"
            class="flex min-w-0 flex-1 flex-col bg-white outline-none dark:bg-black lg:pl-20"
          >
            <slot />
          </main>
          <!-- Intentionally NO #fallback slot (see the mobile-nav note above):
               a ClientOnly #fallback's fragment-boundary markers cause a
               hydration mismatch that re-renders the page content. -->
          <ClientOnly>
            <footer>
              <SiteFooter
                v-if="showFooter"
                class="mt-auto"
                :class="{ 'pl-16': mdAndUp }"
              />
            </footer>
          </ClientOnly>
        </div>
      </div>
    </div>
  </div>
</template>
