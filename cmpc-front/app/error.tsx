'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="grid w-full max-w-sm gap-4 rounded-xl border bg-card p-7 text-center shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Algo salió mal</h1>
        <p className="text-sm text-muted-foreground">
          Ocurrió un error inesperado. Puedes reintentar; si se repite, avisa a soporte
          con este código.
        </p>
        {error.digest && (
          <code className="rounded-lg bg-muted px-2 py-1 text-xs">{error.digest}</code>
        )}
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </main>
  );
}
