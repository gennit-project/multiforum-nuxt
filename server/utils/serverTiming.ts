// Server-Timing for the /api/graphql proxy: the backend reports its own phases
// (queue, parse, validate, execute, db, total); this appends the time the
// Vercel function spent waiting on the backend, so the gap between the two is
// network and function overhead.

export type ProxyServerTimingParams = {
  upstream: string | null;
  proxyMs: number;
};

export const buildProxyServerTiming = ({
  upstream,
  proxyMs,
}: ProxyServerTimingParams): string => {
  const proxyEntry = `proxy;dur=${Math.round(proxyMs * 10) / 10};desc="Vercel -> backend"`;
  return upstream ? `${upstream}, ${proxyEntry}` : proxyEntry;
};
