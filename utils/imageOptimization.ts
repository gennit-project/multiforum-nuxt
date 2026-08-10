export type ImageOptimizationProvider = 'ipx' | 'vercel' | 'none' | string;

export function canOptimizeImageUrl(
  url: string,
  provider: ImageOptimizationProvider = 'ipx'
): boolean {
  if (!url) {
    return false;
  }

  if (
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('javascript:')
  ) {
    return false;
  }

  if (url.startsWith('/')) {
    return true;
  }

  if (!/^https?:\/\//.test(url)) {
    return false;
  }

  if (provider !== 'vercel') {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname === 'storage.googleapis.com';
  } catch {
    return false;
  }
}
