import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import {
  InvalidImageError,
  type ImageSanitizerPort,
} from '../../domain/ports/ImageSanitizerPort';

const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp']);
const MAX_INPUT_PIXELS = 40_000_000;
const MAX_DIMENSION = 1600;

@Injectable()
export class SharpImageSanitizerService implements ImageSanitizerPort {
  async sanitize(input: Buffer): Promise<Buffer> {
    try {
      const image = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS });
      const { format } = await image.metadata();

      if (!format || !ALLOWED_FORMATS.has(format)) {
        throw new InvalidImageError('Formato no permitido. Usa JPEG, PNG o WebP');
      }

      return await image
        .rotate()
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
    } catch (error) {
      if (error instanceof InvalidImageError) throw error;
      throw new InvalidImageError('El archivo no es una imagen válida');
    }
  }
}
