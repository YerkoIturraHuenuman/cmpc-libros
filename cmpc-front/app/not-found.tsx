import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="grid w-full max-w-sm gap-4 rounded-xl border bg-card p-7 text-center shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Página no encontrada</h1>
        <p className="text-sm text-muted-foreground">
          La dirección que abriste no existe o ya no está disponible.
        </p>
        <Button asChild>
          <Link href="/books">Ir a los libros</Link>
        </Button>
      </div>
    </main>
  );
}
