export class InvalidImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidImageError';
  }
}

export interface ImageSanitizerPort {
  sanitize(input: Buffer): Promise<Buffer>;
}
