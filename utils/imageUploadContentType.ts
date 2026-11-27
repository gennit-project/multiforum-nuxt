const imageMimeTypes = new Map([
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['png', 'image/png'],
  ['gif', 'image/gif'],
  ['webp', 'image/webp'],
  ['svg', 'image/svg+xml'],
  ['bmp', 'image/bmp'],
]);

/** Resolve once, before signing. The PUT must replay this same value. */
export function resolveImageUploadContentType(
  file: Pick<File, 'name' | 'type'>,
  fallback = 'application/octet-stream'
): string {
  const extensionIndex = file.name.lastIndexOf('.');
  const extension =
    extensionIndex === -1
      ? ''
      : file.name.slice(extensionIndex + 1).toLowerCase();
  return file.type || imageMimeTypes.get(extension) || fallback;
}
