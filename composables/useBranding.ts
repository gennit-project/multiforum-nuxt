import { computed, type ComputedRef } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useRuntimeConfig } from 'nuxt/app';
import type { ServerConfig } from '@/__generated__/graphql';
import { GET_SERVER_BRANDING } from '@/graphQLData/admin/queries';
import { config } from '@/config';
import {
  resolveBranding,
  type BrandingLayer,
  type BrandingValues,
} from '@/utils/branding';

type ServerConfigBranding = Pick<
  ServerConfig,
  | 'brandingProductName'
  | 'brandingDocsURL'
  | 'brandingSourceURL'
  | 'brandingIssuesURL'
  | 'brandingSupportEmail'
  | 'brandingShowUpstreamLinks'
  | 'brandingCustomFooterLinks'
>;

/**
 * Map the API's field names onto the resolver's. Only keys the admin has
 * actually set are forwarded: a null column means "not configured", which must
 * leave the deployment's own value in place, while an empty string is a
 * deliberate opt-out and is passed through.
 */
export const toBrandingLayer = (
  serverConfig: ServerConfigBranding | null | undefined
): BrandingLayer => {
  if (!serverConfig) return {};

  const layer: BrandingLayer = {};
  const assign = (key: keyof BrandingValues, value: unknown) => {
    if (value !== null && value !== undefined) {
      layer[key] = value;
    }
  };

  assign('productName', serverConfig.brandingProductName);
  assign('docsUrl', serverConfig.brandingDocsURL);
  assign('sourceUrl', serverConfig.brandingSourceURL);
  assign('issuesUrl', serverConfig.brandingIssuesURL);
  assign('supportEmail', serverConfig.brandingSupportEmail);
  assign('showUpstreamLinks', serverConfig.brandingShowUpstreamLinks);
  assign('customFooterLinks', serverConfig.brandingCustomFooterLinks);

  return layer;
};

/**
 * Resolved instance branding for the current deployment.
 *
 * Layers apply lowest precedence first:
 *
 *   upstream defaults -> NUXT_PUBLIC_BRANDING_* -> admin ServerConfig
 *
 * `NUXT_PUBLIC_BRANDING_LOCKED=true` swaps the last two, so a deployment whose
 * branding is managed as deployment config (GitOps, Helm values, a Vercel
 * project) always wins over whatever is stored in the database. The admin form
 * reads that same flag to render itself read-only.
 */
/**
 * Whether branding is pinned by deployment config. Split out so the admin form
 * can render itself read-only without also issuing the branding query.
 */
export const useBrandingLock = (): ComputedRef<boolean> => {
  const runtimeConfig = useRuntimeConfig();
  return computed(() => Boolean(runtimeConfig.public?.brandingLocked));
};

export const useBranding = (): {
  branding: ComputedRef<BrandingValues>;
  brandingIsLocked: ComputedRef<boolean>;
} => {
  const runtimeConfig = useRuntimeConfig();

  const { result } = useQuery(
    GET_SERVER_BRANDING,
    { serverName: config.serverName },
    { fetchPolicy: 'cache-first' }
  );

  const envLayer = computed(
    () => (runtimeConfig.public?.branding ?? {}) as BrandingLayer
  );
  const brandingIsLocked = useBrandingLock();
  const serverLayer = computed(() =>
    toBrandingLayer(result.value?.serverConfigs?.[0])
  );

  const branding = computed(() =>
    resolveBranding({
      layers: brandingIsLocked.value
        ? [serverLayer.value, envLayer.value]
        : [envLayer.value, serverLayer.value],
    })
  );

  return { branding, brandingIsLocked };
};
