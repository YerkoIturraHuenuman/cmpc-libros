import { BadGatewayException, Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorageService } from './CloudinaryStorageService';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: { upload_stream: jest.fn(), destroy: jest.fn() },
  },
}));

const uploadStream = cloudinary.uploader.upload_stream as unknown as jest.Mock;
const destroy = cloudinary.uploader.destroy as unknown as jest.Mock;

const config = (values: Record<string, string> = {}) =>
  ({ get: (key: string) => values[key] }) as unknown as ConfigService;

describe('CloudinaryStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });
  afterEach(() => jest.restoreAllMocks());

  it('configura Cloudinary con las credenciales del entorno', () => {
    new CloudinaryStorageService(
      config({
        CLOUDINARY_CLOUD_NAME: 'demo',
        CLOUDINARY_API_KEY: 'key',
        CLOUDINARY_API_SECRET: 'secret',
      }),
    );

    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'demo',
      api_key: 'key',
      api_secret: 'secret',
      secure: true,
    });
  });

  describe('upload', () => {
    it('sube el buffer a la carpeta configurada y devuelve la URL segura', async () => {
      uploadStream.mockImplementation((_options, callback) => ({
        end: jest.fn(() =>
          callback(undefined, { secure_url: 'https://res.cloudinary.com/demo/x.webp' }),
        ),
      }));
      const service = new CloudinaryStorageService(config({ CLOUDINARY_FOLDER: 'libros' }));

      const url = await service.upload(Buffer.from('img'));

      expect(url).toBe('https://res.cloudinary.com/demo/x.webp');
      expect(uploadStream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'libros',
          resource_type: 'image',
          overwrite: false,
          public_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        }),
        expect.any(Function),
      );
    });

    it('usa la carpeta cmpc-libros por defecto', async () => {
      uploadStream.mockImplementation((_options, callback) => ({
        end: () => callback(undefined, { secure_url: 'u' }),
      }));

      await new CloudinaryStorageService(config()).upload(Buffer.from('i'));

      expect(uploadStream.mock.calls[0][0].folder).toBe('cmpc-libros');
    });

    it.each([
      ['hay un error', new Error('401'), undefined],
      ['no hay resultado', undefined, undefined],
    ])('responde 502 cuando %s', async (_label, error, result) => {
      uploadStream.mockImplementation((_options, callback) => ({
        end: () => callback(error, result),
      }));

      await expect(
        new CloudinaryStorageService(config()).upload(Buffer.from('i')),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });
  });

  describe('delete', () => {
    const service = new CloudinaryStorageService(config());

    it('borra por public_id sacado de la URL', async () => {
      destroy.mockResolvedValue({ result: 'ok' });

      await service.delete(
        'https://res.cloudinary.com/demo/image/upload/v1700000000/cmpc-libros/abc-123.webp',
      );

      expect(destroy).toHaveBeenCalledWith('cmpc-libros/abc-123', {
        resource_type: 'image',
      });
    });

    it('no falla si Cloudinary da error (solo lo registra)', async () => {
      destroy.mockRejectedValue(new Error('timeout'));

      await expect(
        service.delete('https://res.cloudinary.com/demo/image/upload/v1/a/b.webp'),
      ).resolves.toBeUndefined();
    });

    it('ignora URLs que no son de Cloudinary', async () => {
      await service.delete('https://otro.com/foto.png');
      expect(destroy).not.toHaveBeenCalled();
    });
  });

  describe('publicIdFromUrl', () => {
    const service = new CloudinaryStorageService(config());

    it.each([
      ['https://res.cloudinary.com/d/image/upload/v123/carpeta/archivo.webp', 'carpeta/archivo'],
      ['https://res.cloudinary.com/d/image/upload/carpeta/archivo.png', 'carpeta/archivo'],
      ['https://res.cloudinary.com/d/image/upload/v9/solo', 'solo'],
    ])('%s -> %s', (url, expected) => {
      expect(service.publicIdFromUrl(url)).toBe(expected);
    });

    it('devuelve null si no hay /upload/', () => {
      expect(service.publicIdFromUrl('https://x.com/a.png')).toBeNull();
    });
  });
});
