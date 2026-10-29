'use client';

import { useEffect, useState } from 'react';
import { validateImage } from '../_utils/bookImage';

export function useBookImage(currentUrl: string | null) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const select = (selected: File | undefined) => {
    if (!selected) return;
    const problem = validateImage(selected);
    setError(problem);
    if (problem) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setRemoved(false);
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setRemoved(currentUrl !== null);
  };

  const restore = () => setRemoved(false);

  return {
    file,
    removed,
    error,
    shownUrl: preview ?? (removed ? null : currentUrl),
    select,
    clear,
    restore,
  };
}
