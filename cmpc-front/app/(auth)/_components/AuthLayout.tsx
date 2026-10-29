import type { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';
import ShinyText from '@/components/ShinyText';
import Lightfall from '@/components/Lightfall';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

const BRAND = 'CMPC Libros';

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="grid min-h-svh lg:grid-cols-[minmax(24rem,1fr)_2fr]">
      <section
        className="flex flex-col border-border bg-card px-8 py-10 sm:px-12 lg:border-r"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center gap-3 text-lg font-semibold">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="size-5" aria-hidden />
          </span>
          {BRAND}
        </header>

        <div className="mx-auto my-auto grid w-full max-w-sm gap-8 py-10">
          <div className="grid gap-3">
            <h1 className="text-4xl font-semibold tracking-tight">
              <ShinyText text={title} color="#000000" shineColor="#737373" />
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>

        <footer className="text-sm text-muted-foreground">© 2026 {BRAND}</footer>
      </section>

      <aside
        aria-hidden
        className="relative hidden overflow-hidden bg-black lg:block"
      >
        <div className="absolute inset-0">
          <Lightfall colors={['#ffffff', '#ffffff']} backgroundColor="#000000" />
        </div>
      </aside>
    </main>
  );
}
