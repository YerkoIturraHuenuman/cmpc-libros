import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { cn } from '@/utils/cn';
import { framingStyle, type Framing } from '../_utils/coverFraming';

interface BookCoverProps {
  src: string | null;
  title: string;
  sizes?: string;
  framing?: Framing | null;
  className?: string;
}

export function BookCover({ src, title, sizes = '160px', framing, className }: BookCoverProps) {
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground',
        className,
      )}
    >
      {src && framing ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Portada de ${title}`}
          className="absolute max-w-none"
          style={framingStyle(framing)}
        />
      ) : src ? (
        <Image
          src={src}
          alt={`Portada de ${title}`}
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <BookOpen className="size-1/3" aria-label="Sin portada" />
      )}
    </div>
  );
}
