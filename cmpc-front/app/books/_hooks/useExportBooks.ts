'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorMessage';
import { booksService, type BookFiltersParams } from '../_services/booksService';
import { downloadBlob } from '../_utils/downloadBlob';

export function useExportBooks(params: BookFiltersParams) {
  const [isExporting, setIsExporting] = useState(false);

  const exportCsv = async () => {
    setIsExporting(true);
    try {
      downloadBlob(await booksService.exportCsv(params), 'libros.csv');
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo exportar el CSV'));
    } finally {
      setIsExporting(false);
    }
  };

  return { exportCsv, isExporting };
}
