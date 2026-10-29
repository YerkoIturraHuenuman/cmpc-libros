export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'La portada debe ser JPEG, PNG o WebP';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'La portada no puede superar los 5 MB';
  }
  return null;
}
