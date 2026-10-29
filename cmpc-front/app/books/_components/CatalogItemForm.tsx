'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { CatalogFormValues } from '../_utils/catalogSchema';

interface CatalogItemFormProps {
  form: UseFormReturn<CatalogFormValues>;
  label: string;
  placeholder: string;
  onSubmit: () => void;
  onCancel: () => void;
  serverError: string | null;
  isSubmitting: boolean;
}

export function CatalogItemForm({
  form,
  label,
  placeholder,
  onSubmit,
  onCancel,
  serverError,
  isSubmitting,
}: CatalogItemFormProps) {
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="catalog-name">Nombre</FieldLabel>
            <Input
              {...field}
              id="catalog-name"
              placeholder={placeholder}
              autoComplete="off"
              autoFocus
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : `Crear ${label}`}
        </Button>
      </DialogFooter>
    </form>
  );
}
