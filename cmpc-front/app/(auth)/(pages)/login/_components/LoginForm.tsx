'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { LoginValues } from '../../../_utils/loginSchema';

interface LoginFormProps {
  form: UseFormReturn<LoginValues>;
  onSubmit: () => void;
  serverError: string | null;
  isSubmitting: boolean;
  isReady: boolean;
}

export function LoginForm({
  form,
  onSubmit,
  serverError,
  isSubmitting,
  isReady,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} method="post" autoComplete="off" noValidate className="grid gap-7">
      <FieldGroup>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="email">Correo</FieldLabel>
              <Input
                {...field}
                id="email"
                type="email"
                autoComplete="off"
                placeholder="tu@correo.cl"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <Input
                {...field}
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting || !isReady}>
        {isSubmitting ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  );
}
