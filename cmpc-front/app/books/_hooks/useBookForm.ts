'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorMessage';
import { booksService, type Book } from '../_services/booksService';
import { toBookFormData } from '../_utils/bookFormData';
import { bookSchema, type BookFormValues } from '../_utils/bookSchema';
import { useBookImage } from './useBookImage';

const EMPTY_VALUES: BookFormValues = {
  title: '',
  price: '',
  isAvailable: true,
  authorId: '',
  publisherId: '',
  genreId: '',
};

function toDefaultValues(book: Book | null): BookFormValues {
  if (!book) return EMPTY_VALUES;
  return {
    title: book.title,
    price: String(book.price),
    isAvailable: book.isAvailable,
    authorId: book.author.id,
    publisherId: book.publisher.id,
    genreId: book.genre.id,
  };
}

export function useBookForm(book: Book | null, onSaved: () => void) {
  const [serverError, setServerError] = useState<string | null>(null);
  const image = useBookImage(book?.imageUrl ?? null);

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: toDefaultValues(book),
    mode: 'onTouched',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    const body = toBookFormData(values, {
      file: image.file,
      removeImage: image.removed,
      expectedUpdatedAt: book?.updatedAt,
    });

    try {
      if (book) {
        await booksService.update(book.id, body);
        toast.success('Libro actualizado');
      } else {
        await booksService.create(body);
        toast.success('Libro creado');
      }
      onSaved();
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  return {
    form,
    image,
    onSubmit,
    serverError,
    isEditing: book !== null,
    isSubmitting: form.formState.isSubmitting,
  };
}
