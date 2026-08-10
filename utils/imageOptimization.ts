export function canOptimizeImageUrl(url: string): boolean {
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

  return false;
}
