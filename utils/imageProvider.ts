export type ImageProvider = 'ipx' | 'vercel';

type ResolveImageProviderInput = {
  nitroPreset?: string;
  vercel?: string;
};

export const resolveImageProvider = ({
  nitroPreset,
  vercel,
}: ResolveImageProviderInput): ImageProvider => {
  return nitroPreset === 'vercel' || vercel === '1' ? 'vercel' : 'ipx';
};
