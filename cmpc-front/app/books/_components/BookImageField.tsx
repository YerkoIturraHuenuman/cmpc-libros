'use client';

import { useRef, useState } from 'react';
import { Crop, ImagePlus, Trash2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { ACCEPTED_IMAGE_TYPES } from '../_utils/bookImage';
import type { Framing } from '../_utils/coverFraming';
import { BookCover } from './BookCover';
import { ImageCropDialog } from './ImageCropDialog';

interface BookImageFieldProps {
  title: string;
  shownUrl: string | null;
  hasCurrent: boolean;
  removed: boolean;
  error: string | null;
  onSelect: (file: File | undefined) => void;
  onClear: () => void;
  onRestore: () => void;
}

export function BookImageField({
  title,
  shownUrl,
  hasCurrent,
  removed,
  error,
  onSelect,
  onClear,
  onRestore,
}: BookImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropping, setCropping] = useState(false);
  const [framing, setFraming] = useState<Framing | null>(null);

  const choose = (file: File | undefined) => {
    if (!file) return;
    onSelect(file);
    setFraming(null);
    setCropping(true);
  };

  const clear = () => {
    setFraming(null);
    setCropping(false);
    onClear();
  };

  const restore = () => {
    setFraming(null);
    onRestore();
  };

  return (
    <Field data-invalid={error !== null}>
      <FieldLabel>Portada</FieldLabel>
      <div className="flex items-center gap-4">
        {shownUrl ? (
          <button
            type="button"
            onClick={() => setCropping(true)}
            aria-label="Ajustar encuadre"
            title="Ajustar encuadre"
            className="group relative shrink-0 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <BookCover src={shownUrl} title={title} framing={framing} className="h-28 w-20" />
            <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Crop className="size-6" />
            </span>
          </button>
        ) : (
          <BookCover src={null} title={title} className="h-28 w-20" />
        )}
        <div className="grid w-52 gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            className="hidden"
            onChange={(event) => {
              choose(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus /> {shownUrl ? 'Cambiar imagen' : 'Cargar imagen'}
          </Button>
          {removed && hasCurrent ? (
            <Button type="button" variant="ghost" onClick={restore}>
              <Undo2 /> Conservar la actual
            </Button>
          ) : (
            <Button type="button" variant="ghost" disabled={!shownUrl} onClick={clear}>
              <Trash2 /> Quitar
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            JPEG, PNG o WebP. Máximo 5 MB.
          </p>
        </div>
      </div>
      {error && <FieldError errors={[{ message: error }]} />}
      <ImageCropDialog
        src={cropping ? shownUrl : null}
        framing={framing}
        onCancel={() => setCropping(false)}
        onApply={(area) => {
          setFraming(area);
          setCropping(false);
        }}
      />
    </Field>
  );
}
