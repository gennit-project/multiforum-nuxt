import { computed, onMounted, onBeforeUnmount, ref } from 'vue';

/**
 * SSR-safe responsive breakpoint composable — a drop-in replacement for
 * Vuetify's `useDisplay()`.
 *
 * The thresholds and `mobile` breakpoint mirror Vuetify's defaults exactly
 * (mobileBreakpoint: 'lg'), so responsive behavior is unchanged after removing
 * the Vuetify dependency:
 *   xs < 600 ≤ sm < 960 ≤ md < 1280 ≤ lg < 1920 ≤ xl < 2560 ≤ xxl
 *
 * Like Vuetify's `ssr: true`, the width starts at 0 on the server AND the first
 * client render (i.e. the mobile-first defaults), so the server output matches
 * the first client render and there is no hydration mismatch. The real viewport
 * width is applied after mount, at which point the reactive breakpoints update.
 */
export const thresholds = {
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
  xxl: 2560,
} as const;

// Vuetify's default mobileBreakpoint is 'lg': anything narrower than the `lg`
// threshold is considered "mobile".
const MOBILE_THRESHOLD = thresholds.lg;

export function useDisplay() {
  const width = ref(0);
  const height = ref(0);

  const update = () => {
    width.value = window.innerWidth;
    height.value = window.innerHeight;
  };

  onMounted(() => {
    update();
    window.addEventListener('resize', update, { passive: true });
  });
  onBeforeUnmount(() => {
    window.removeEventListener('resize', update);
  });

  const xs = computed(() => width.value < thresholds.sm);
  const sm = computed(
    () => width.value >= thresholds.sm && width.value < thresholds.md
  );
  const md = computed(
    () => width.value >= thresholds.md && width.value < thresholds.lg
  );
  const lg = computed(
    () => width.value >= thresholds.lg && width.value < thresholds.xl
  );
  const xl = computed(
    () => width.value >= thresholds.xl && width.value < thresholds.xxl
  );
  const xxl = computed(() => width.value >= thresholds.xxl);

  const smAndUp = computed(() => width.value >= thresholds.sm);
  const mdAndUp = computed(() => width.value >= thresholds.md);
  const lgAndUp = computed(() => width.value >= thresholds.lg);
  const xlAndUp = computed(() => width.value >= thresholds.xl);

  const smAndDown = computed(() => width.value < thresholds.md);
  const mdAndDown = computed(() => width.value < thresholds.lg);
  const lgAndDown = computed(() => width.value < thresholds.xl);

  const mobile = computed(() => width.value < MOBILE_THRESHOLD);

  return {
    width,
    height,
    xs,
    sm,
    md,
    lg,
    xl,
    xxl,
    smAndUp,
    mdAndUp,
    lgAndUp,
    xlAndUp,
    smAndDown,
    mdAndDown,
    lgAndDown,
    mobile,
  };
}
