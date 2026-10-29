import { randomUUID } from 'node:crypto';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { FlowLogger } from '@/common/logging/FlowLogger';
import type { FileStoragePort } from '../../domain/ports/FileStoragePort';

@Injectable()
export class CloudinaryStorageService implements FileStoragePort {
  private readonly flow = new FlowLogger(CloudinaryStorageService.name);
  private readonly folder: string;

  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
    this.folder = config.get<string>('CLOUDINARY_FOLDER') ?? 'cmpc-libros';
  }

  upload(buffer: Buffer): Promise<string> {
    this.flow.request('upload', { bytes: buffer.length });
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: this.folder,
          public_id: randomUUID(),
          resource_type: 'image',
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            this.flow.error('upload', error ?? new Error('Sin resultado'));
            reject(new BadGatewayException('No se pudo subir la imagen'));
            return;
          }
          this.flow.response('upload', { url: result.secure_url });
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });
  }

  async delete(url: string): Promise<void> {
    const publicId = this.publicIdFromUrl(url);
    if (!publicId) return;

    this.flow.request('delete', { publicId });
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      this.flow.response('delete', { publicId });
    } catch (error) {
      this.flow.error('delete', error, { publicId });
    }
  }

  publicIdFromUrl(url: string): string | null {
    const match = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i.exec(url);
    return match ? match[1] : null;
  }
}
