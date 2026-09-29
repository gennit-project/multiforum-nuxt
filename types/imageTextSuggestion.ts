export type ImageTextSuggestion = {
  alt: string;
  caption: string;
};

export type ImageTextSuggestionRequest = {
  imageUrl: string;
  currentAlt?: string;
  currentCaption?: string;
};
