/**
 * Pure album image-ordering helpers, extracted from AlbumEditor. The album
 * stores images plus an `imageOrder` array of image ids; these compute the
 * displayed order and reorder the id list.
 */

export type OrderableImage = { id?: string | null };

export type OrderImagesParams<T> = {
  images: T[] | null | undefined;
  imageOrder: string[] | null | undefined;
};

/**
 * Return images sorted by `imageOrder`. Falls back to the original order when
 * no `imageOrder` is set; drops ids in the order that have no matching image.
 */
export function orderImagesByOrder<T extends OrderableImage>(
  params: OrderImagesParams<T>
): T[] {
  const { images, imageOrder } = params;
  if (!images) return [];
  if (!imageOrder || imageOrder.length === 0) return images;

  return imageOrder
    .map((imageId) => images.find((image) => image.id === imageId))
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
