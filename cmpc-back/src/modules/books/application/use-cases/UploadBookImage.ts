import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { FILE_STORAGE, IMAGE_SANITIZER } from '@/common/config/di-tokens';
import { FlowLogger } from '@/common/logging/FlowLogger';
import type { FileStoragePort } from '../../domain/ports/FileStoragePort';
import {
  InvalidImageError,
  type ImageSanitizerPort,
} from '../../domain/ports/ImageSanitizerPort';

@Injectable()
export class UploadBookImage {
  private readonly flow = new FlowLogger(UploadBookImage.name);

  constructor(
    @Inject(IMAGE_SANITIZER) private readonly sanitizer: ImageSanitizerPort,
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
  ) {}

  execute(file: Buffer): Promise<string> {
    return this.flow.track(
      'execute',
      { bytes: file.length },
      async () => {
        let clean: Buffer;
        try {
          clean = await this.sanitizer.sanitize(file);
        } catch (error) {
          if (error instanceof InvalidImageError) {
            throw new BadRequestException(error.message);
          }
          throw error;
        }
        return this.storage.upload(clean);
      },
      (url) => ({ url }),
    );
  }
}
