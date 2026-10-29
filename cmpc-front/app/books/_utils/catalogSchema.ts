import { z } from 'zod';

export const catalogSchema = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre').max(120, 'Máximo 120 caracteres'),
});

export type CatalogFormValues = z.infer<typeof catalogSchema>;
