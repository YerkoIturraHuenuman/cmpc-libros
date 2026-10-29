import { z } from 'zod';

const MAX_PRICE = 99_999_999.99;

export function parsePrice(value: string): number {
  return Number(value.trim().replace(',', '.'));
}

export const bookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'El título es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  price: z
    .string()
    .trim()
    .min(1, 'Ingresa el precio')
    .refine(
      (value) => /^\d+([.,]\d{1,2})?$/.test(value),
      'Usa un número positivo con hasta 2 decimales',
    )
    .refine(
      (value) => parsePrice(value) <= MAX_PRICE,
      'El precio es demasiado alto',
    ),
  isAvailable: z.boolean(),
  authorId: z.string().min(1, 'Selecciona un autor'),
  publisherId: z.string().min(1, 'Selecciona una editorial'),
  genreId: z.string().min(1, 'Selecciona un género'),
});

export type BookFormValues = z.infer<typeof bookSchema>;
