'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorMessage';
import { catalogService, type CatalogItem, type CatalogKind } from '../_services/catalogService';
import { CATALOG_LABELS } from '../_utils/catalogLabels';
import { catalogSchema, type CatalogFormValues } from '../_utils/catalogSchema';

export function useCatalogItemForm(kind: CatalogKind, onCreated: (item: CatalogItem) => void) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CatalogFormValues>({
    resolver: zodResolver(catalogSchema),
    defaultValues: { name: '' },
    mode: 'onTouched',
  });

  const onSubmit = form.handleSubmit(async ({ name }) => {
    setServerError(null);
    try {
      const item = await catalogService.create(kind, name);
      toast.success(`${capitalize(CATALOG_LABELS[kind].singular)} creado`);
      onCreated(item);
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  return { form, onSubmit, serverError, isSubmitting: form.formState.isSubmitting };
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
