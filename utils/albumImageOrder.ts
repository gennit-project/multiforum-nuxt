/**
 * Pure album image-ordering helpers, extracted from AlbumEditor. The album
 * stores images plus an `imageOrder` array of image ids; these compute the
 * displayed order and reorder the id list.
 */

export type OrderableImage = { id?: string | null };

export type OrderImagesParams<T> = {
  images: T[] | null | undefined;
  // Accepts GraphQL `Maybe<string>[]`; null/undefined ids simply match nothing.
  imageOrder: (string | null | undefined)[] | null | undefined;
};

/**
 * Return a complete, de-duplicated order for the supplied images. Valid stored
 * order entries stay first, while connected images missing from a stale order
 * are appended in their source order.
 */
export function normalizeImageOrder<T extends OrderableImage>(
  params: OrderImagesParams<T>
): string[] {
  const { images, imageOrder } = params;
  const imageIds = getImageIdOrder(images ?? []);
  const validImageIds = new Set(imageIds);
  const seen = new Set<string>();
  const normalizedOrder: string[] = [];

  for (const imageId of imageOrder ?? []) {
    if (
      typeof imageId === 'string' &&
      validImageIds.has(imageId) &&
      !seen.has(imageId)
    ) {
      seen.add(imageId);
      normalizedOrder.push(imageId);
    }
  }

  for (const imageId of imageIds) {
    if (!seen.has(imageId)) {
      seen.add(imageId);
      normalizedOrder.push(imageId);
    }
  }

  return normalizedOrder;
}

/**
 * Return every connected image sorted by `imageOrder`. Images omitted from a
 * stale order are appended so an incomplete scalar cannot hide relationships.
 */
export function orderImagesByOrder<T extends OrderableImage>(
  params: OrderImagesParams<T>
): T[] {
  const { images } = params;
  if (!images) return [];
  if (!params.imageOrder || params.imageOrder.length === 0) return images;

  const imagesById = new Map(
    images
      .filter((image) => typeof image.id === 'string')
      .map((image) => [image.id as string, image])
  );

  return normalizeImageOrder(params)
    .map((imageId) => imagesById.get(imageId))
    .filter((image): image is T => image !== undefined);
}

/** The list of image ids, used to persist a new order. */
export function getImageIdOrder<T extends OrderableImage>(
  images: T[]
): string[] {
  return images
    .map((image) => image.id)
    .filter((id): id is string => id !== undefined && id !== null);
}

const swap = (order: string[], a: number, b: number): string[] => {
  const next = [...order];
  const itemA = next[a];
  const itemB = next[b];
  if (itemA !== undefined && itemB !== undefined) {
    next[a] = itemB;
    next[b] = itemA;
  }
  return next;
};

/** Move the id at `index` one position earlier; no-op at the start. */
export function moveImageOrderUp(
  imageOrder: string[],
  index: number
): string[] {
  if (index <= 0) return [...imageOrder];
  return swap(imageOrder, index, index - 1);
}

/** Move the id at `index` one position later; no-op at the end. */
export function moveImageOrderDown(
  imageOrder: string[],
  index: number
): string[] {
  if (index >= imageOrder.length - 1) return [...imageOrder];
  return swap(imageOrder, index, index + 1);
}
