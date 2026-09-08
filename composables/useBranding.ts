import { computed, type ComputedRef } from 'vue';
import { useRuntimeConfig } from 'nuxt/app';
import {
  resolveBranding,
  type BrandingLayer,
  type BrandingValues,
} from '@/utils/branding';

/**
 * Resolved instance branding for the current deployment.
 *
 * Phase 0 has a single configurable layer (`runtimeConfig.public.branding`,
 * populated from VITE_BRANDING_* at build time and overridable by
 * NUXT_PUBLIC_BRANDING_* at container startup). The admin-editable ServerConfig
 * layer slots in as a second entry in `layers` without changing consumers.
 */
export const useBranding = (): { branding: ComputedRef<BrandingValues> } => {
  const runtimeConfig = useRuntimeConfig();

  const branding = computed(() =>
    resolveBranding({
      layers: [runtimeConfig.public?.branding as BrandingLayer | undefined],
    })
  );

  return { branding };
};
