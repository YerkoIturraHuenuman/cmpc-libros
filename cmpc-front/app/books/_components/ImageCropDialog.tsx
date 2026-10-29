'use client';

import { useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { COVER_ASPECT, type Framing } from '../_utils/coverFraming';

interface ImageCropDialogProps {
  src: string | null;
  framing: Framing | null;
  onCancel: () => void;
  onApply: (framing: Framing) => void;
}

function CropEditor({
  src,
  framing,
  onCancel,
  onApply,
}: Omit<ImageCropDialogProps, 'src'> & { src: string }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(framing);
  const [imageAspect, setImageAspect] = useState(framing?.imageAspect ?? COVER_ASPECT);

  return (
    <>
      <div className="relative h-80 w-full overflow-hidden rounded-lg bg-muted">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={imageAspect}
          initialCroppedAreaPercentages={framing ?? undefined}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onMediaLoaded={(media) => setImageAspect(media.naturalWidth / media.naturalHeight)}
          onCropComplete={(percentages) => setArea(percentages)}
        />
      </div>
      <label className="flex items-center gap-3 text-sm">
        Zoom
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          aria-label="Zoom"
          className="w-full accent-primary"
        />
      </label>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" onClick={() => onApply({ ...(area as Area), imageAspect })} disabled={!area}>
          Aplicar
        </Button>
      </DialogFooter>
    </>
  );
}

export function ImageCropDialog({ src, framing, onCancel, onApply }: ImageCropDialogProps) {
  return (
    <Dialog open={src !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar portada</DialogTitle>
          <DialogDescription>Arrastra la imagen para centrarla y usa el zoom.</DialogDescription>
        </DialogHeader>
        {src && <CropEditor src={src} framing={framing} onCancel={onCancel} onApply={onApply} />}
      </DialogContent>
    </Dialog>
  );
}
