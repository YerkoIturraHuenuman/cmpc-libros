'use client';

import { Button } from '@/components/ui/button';
import './globals.css';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="es">
      <body className="grid min-h-svh place-items-center bg-background font-sans text-foreground antialiased">
        <div className="grid justify-items-center gap-3 p-6 text-center">
          <h1 className="text-xl font-semibold">Algo salió mal</h1>
          <p className="text-sm text-muted-foreground">No se pudo cargar la aplicación.</p>
          <Button onClick={reset}>Reintentar</Button>
        </div>
      </body>
    </html>
  );
}
