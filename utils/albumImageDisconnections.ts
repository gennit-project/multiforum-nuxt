type AlbumImageReference = {
  id?: string | null;
};

export function getRemovedAlbumImageIds(params: {
  existingImages?: AlbumImageReference[] | null;
  currentImages?: AlbumImageReference[] | null;
}): string[] {
  const currentImageIds = new Set(
    (params.currentImages ?? [])
      .map((image) => image.id)
      .filter(
        (imageId): imageId is string =>
          typeof imageId === 'string' && imageId.length > 0
      )
  );

  return [
    ...new Set(
      (params.existingImages ?? [])
        .map((image) => image.id)
        .filter(
          (imageId): imageId is string =>
            typeof imageId === 'string' && imageId.length > 0
        )
        .filter((imageId) => !currentImageIds.has(imageId))
    ),
  ];
}
