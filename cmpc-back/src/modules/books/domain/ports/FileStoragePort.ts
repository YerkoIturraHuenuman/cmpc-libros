export interface FileStoragePort {
  upload(buffer: Buffer): Promise<string>;
  delete(url: string): Promise<void>;
}
