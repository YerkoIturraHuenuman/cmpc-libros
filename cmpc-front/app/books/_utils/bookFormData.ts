import { parsePrice, type BookFormValues } from './bookSchema';

interface ImageChange {
  file: File | null;
  removeImage: boolean;
  expectedUpdatedAt?: string;
}

export function toBookFormData(
  values: BookFormValues,
  { file, removeImage, expectedUpdatedAt }: ImageChange,
): FormData {
  const data = new FormData();
  data.set('title', values.title.trim());
  data.set('price', String(parsePrice(values.price)));
  data.set('isAvailable', String(values.isAvailable));
  data.set('authorId', values.authorId);
  data.set('publisherId', values.publisherId);
  data.set('genreId', values.genreId);

  if (expectedUpdatedAt) {
    data.set('expectedUpdatedAt', expectedUpdatedAt);
  }

  if (file) {
    data.set('image', file);
  } else if (removeImage) {
    data.set('removeImage', 'true');
  }
  return data;
}
