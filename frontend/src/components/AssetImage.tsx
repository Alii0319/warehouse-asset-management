import { ImageOff } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

interface AssetImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

export function AssetImage({ src, alt, className }: AssetImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-slate-100 text-slate-400',
          className,
        )}
        aria-label={alt}
      >
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('object-cover bg-slate-100', className)}
    />
  );
}
