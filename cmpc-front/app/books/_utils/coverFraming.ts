import type { Area } from 'react-easy-crop';

export const COVER_ASPECT = 5 / 7;

export interface Framing extends Area {
  imageAspect: number;
}

export function framingStyle({ x, y, width, height, imageAspect }: Framing) {
  const imageWidth = 10000 * Math.max(1 / width, imageAspect / (COVER_ASPECT * height));
  const imageHeight = (COVER_ASPECT * imageWidth) / imageAspect;

  return {
    width: `${imageWidth}%`,
    height: `${imageHeight}%`,
    left: `${50 - (imageWidth * (x + width / 2)) / 100}%`,
    top: `${50 - (imageHeight * (y + height / 2)) / 100}%`,
  };
}
