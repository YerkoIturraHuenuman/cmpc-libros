import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresa tu correo')
    .pipe(z.email('El correo no es válido')),
  password: z
    .string()
    .min(1, 'Ingresa tu contraseña')
    .max(128, 'La contraseña es demasiado larga'),
});

export type LoginValues = z.infer<typeof loginSchema>;
