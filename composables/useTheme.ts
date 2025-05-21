import { computed, ref, watch, nextTick } from "vue";
import { useCookie, useRoute, useRouter } from "nuxt/app";

export const useTheme = () => {
  const themeCookie = useCookie("theme", {
    default: () => "system",
  });

  const currentThemeValue = ref(themeCookie.value);
  const systemThemeIsDark = ref(true);

  if (import.meta.client) {
    const localTheme = localStorage.getItem("theme");
    if (localTheme) {
      currentThemeValue.value = localTheme;
      themeCookie.value = localTheme;
    }

    systemThemeIsDark.value = window.matchMedia("(prefers-color-scheme: dark)").matches;

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      systemThemeIsDark.value = e.matches;
    });
  }

  const setTheme = (newTheme: string) => {
    // Only get route and router when needed
    const route = useRoute();
    const router = useRouter();

    // Capture current query params before theme change
    const currentQuery = { ...route.query };

    currentThemeValue.value = newTheme;
    themeCookie.value = newTheme;

    if (import.meta.client) {
      localStorage.setItem("theme", newTheme);

      // Use nextTick to ensure query params are preserved after theme update
      nextTick(() => {
        if (Object.keys(currentQuery).length) {
          router.replace({
            path: route.path,
            query: currentQuery,
          });
        }
      });
    }
  };

  const computedTheme = computed(() => {
    if (currentThemeValue.value === "system") {
      return systemThemeIsDark.value ? "dark" : "light";
    }
    return currentThemeValue.value;
  });

  // Apply theme class during SSR and client
  if (import.meta.server) {
    useHead({
      htmlAttrs: {
        class: computedTheme.value === "dark" ? "dark" : "",
      },
    });
  }

  // Watch for theme changes and apply class to html element
  if (import.meta.client) {
    watch(
      computedTheme,
      (newTheme) => {
        if (newTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },
      { immediate: true }
    );
  }

  return {
    theme: computedTheme,
    setTheme,
  };
};
