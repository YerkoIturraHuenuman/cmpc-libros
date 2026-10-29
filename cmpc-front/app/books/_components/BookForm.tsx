'use client';

import { Plus } from 'lucide-react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { CatalogItem, CatalogKind } from '../_services/catalogService';
import { CATALOG_LABELS } from '../_utils/catalogLabels';
import type { BookFormValues } from '../_utils/bookSchema';
import { OptionSelect } from './OptionSelect';
import { PriceInput } from './PriceInput';

interface BookFormProps {
  form: UseFormReturn<BookFormValues>;
  imageField: React.ReactNode;
  authors: CatalogItem[];
  publishers: CatalogItem[];
  genres: CatalogItem[];
  onSubmit: () => void;
  onCancel: () => void;
  onAddCatalogItem: (kind: CatalogKind) => void;
  serverError: string | null;
  isSubmitting: boolean;
  isEditing: boolean;
}

const toOptions = (items: CatalogItem[]) =>
  items.map((item) => ({ value: item.id, label: item.name }));

function AddButton({ kind, onAdd }: { kind: CatalogKind; onAdd: (kind: CatalogKind) => void }) {
  const { singular } = CATALOG_LABELS[kind];
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => onAdd(kind)}
      aria-label={`Agregar ${singular}`}
      title={`Agregar ${singular} nuevo`}
    >
      <Plus />
    </Button>
  );
}

export function BookForm({
  form,
  imageField,
  authors,
  publishers,
  genres,
  onSubmit,
  onCancel,
  onAddCatalogItem,
  serverError,
  isSubmitting,
  isEditing,
}: BookFormProps) {
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="book-title">Título</FieldLabel>
              <Input
                {...field}
                id="book-title"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="price"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="book-price">Precio (CLP)</FieldLabel>
              <PriceInput
                {...field}
                id="book-price"
                placeholder="$12.990"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="authorId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="book-author">Autor</FieldLabel>
              <div className="flex gap-2">
                <OptionSelect
                  id="book-author"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={toOptions(authors)}
                  placeholder="Selecciona un autor"
                  invalid={fieldState.invalid}
                />
                <AddButton kind="authors" onAdd={onAddCatalogItem} />
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="publisherId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="book-publisher">Editorial</FieldLabel>
              <div className="flex gap-2">
                <OptionSelect
                  id="book-publisher"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={toOptions(publishers)}
                  placeholder="Selecciona una editorial"
                  invalid={fieldState.invalid}
                />
                <AddButton kind="publishers" onAdd={onAddCatalogItem} />
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="genreId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="book-genre">Género</FieldLabel>
              <div className="flex gap-2">
                <OptionSelect
                  id="book-genre"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={toOptions(genres)}
                  placeholder="Selecciona un género"
                  invalid={fieldState.invalid}
                />
                <AddButton kind="genres" onAdd={onAddCatalogItem} />
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="isAvailable"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <input
                id="book-available"
                type="checkbox"
                checked={field.value}
                onChange={(event) => field.onChange(event.target.checked)}
                onBlur={field.onBlur}
                className="size-4 accent-primary"
              />
              <FieldLabel htmlFor="book-available">Disponible para la venta</FieldLabel>
            </Field>
          )}
        />

        {imageField}
      </FieldGroup>

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
          {isSubmitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear libro'}
        </Button>
      </DialogFooter>
    </form>
  );
}
