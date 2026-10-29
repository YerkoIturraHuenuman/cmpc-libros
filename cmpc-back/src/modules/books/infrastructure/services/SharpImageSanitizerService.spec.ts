import sharp from 'sharp';
import { InvalidImageError } from '../../domain/ports/ImageSanitizerPort';
import { SharpImageSanitizerService } from './SharpImageSanitizerService';

const blank = (width: number, height: number) =>
  sharp({
    create: { width, height, channels: 3, background: { r: 40, g: 160, b: 90 } },
  });

describe('SharpImageSanitizerService', () => {
  const sanitizer = new SharpImageSanitizerService();

  it.each([
    ['png', () => blank(50, 50).png().toBuffer()],
    ['jpeg', () => blank(50, 50).jpeg().toBuffer()],
    ['webp', () => blank(50, 50).webp().toBuffer()],
  ])('acepta %s y lo reescribe como webp', async (_name, build) => {
    const output = await sanitizer.sanitize(await build());

    expect((await sharp(output).metadata()).format).toBe('webp');
  });

  it('reduce las imágenes grandes sin deformarlas', async () => {
    const big = await blank(3200, 1600).png().toBuffer();

    const { width, height } = await sharp(await sanitizer.sanitize(big)).metadata();

    expect(width).toBe(1600);
    expect(height).toBe(800);
  });

  it('no agranda las imágenes pequeñas', async () => {
    const small = await blank(30, 20).png().toBuffer();

    const { width, height } = await sharp(await sanitizer.sanitize(small)).metadata();

    expect([width, height]).toEqual([30, 20]);
  });

  it('elimina los metadatos EXIF', async () => {
    const withExif = await blank(40, 40)
      .jpeg()
      .withMetadata({ exif: { IFD0: { Copyright: 'dato-privado' } } })
      .toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();

    const output = await sanitizer.sanitize(withExif);

    expect((await sharp(output).metadata()).exif).toBeUndefined();
    expect(output.toString('latin1')).not.toContain('dato-privado');
  });

  it('rechaza SVG, que puede traer scripts', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>',
    );

    await expect(sanitizer.sanitize(svg)).rejects.toBeInstanceOf(InvalidImageError);
  });

  it('rechaza formatos de imagen no permitidos (gif)', async () => {
    const gif = await blank(10, 10).gif().toBuffer();

    await expect(sanitizer.sanitize(gif)).rejects.toThrow('Formato no permitido');
  });

  it('rechaza archivos que no son imágenes, aunque se hagan pasar por una', async () => {
    await expect(sanitizer.sanitize(Buffer.from('#!/bin/sh\nrm -rf /'))).rejects.toThrow(
      'no es una imagen válida',
    );
    await expect(sanitizer.sanitize(Buffer.alloc(0))).rejects.toBeInstanceOf(
      InvalidImageError,
    );
  });

  it('rechaza un archivo con cabecera PNG pero contenido corrupto', async () => {
    const fake = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.from('esto no es un png'),
    ]);

    await expect(sanitizer.sanitize(fake)).rejects.toBeInstanceOf(InvalidImageError);
  });
});
