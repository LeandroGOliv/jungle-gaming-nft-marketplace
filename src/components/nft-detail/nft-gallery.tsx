import { useState } from 'react'
import { MaskIcon } from '@/components/layout/mask-icon'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { NftImage } from '@/types/nft'

interface GalleryProps {
  images: Array<NftImage>
  nftName: string
  selected: number
  onSelect: (index: number) => void
}

/** Desktop e tablet: miniaturas à esquerda, imagem principal e lupa. */
export function NftGallery({
  images,
  nftName,
  selected,
  onSelect,
}: GalleryProps) {
  const [zoomOpen, setZoomOpen] = useState(false)
  const image = images[selected] ?? images[0]

  return (
    <div className="flex gap-4 lg:w-[573px] lg:shrink-0 lg:gap-7">
      <ul
        aria-label={`Imagens de ${nftName}`}
        className="flex w-[100px] shrink-0 flex-col gap-4"
      >
        {images.map((thumb, index) => (
          <li key={thumb.smallUrl} className="rounded-md bg-card">
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={index === selected}
              aria-label={`Mostrar imagem ${index + 1} de ${images.length}`}
              className={cn(
                'focus-ring block size-[100px] cursor-pointer overflow-hidden rounded-lg border border-transparent transition-colors motion-reduce:transition-none',
                index === selected ? 'border-primary' : 'hover:border-border',
              )}
            >
              <img
                src={thumb.smallUrl}
                alt=""
                width={100}
                height={100}
                className="size-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative aspect-square min-w-0 flex-1 rounded-md bg-card p-4 lg:size-[444px] lg:flex-none lg:p-5">
        <img
          src={image.largeUrl}
          alt={image.alt}
          width={800}
          height={800}
          fetchPriority="high"
          className="size-full rounded-3xl object-cover"
        />
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label="Ampliar imagem"
          className="focus-ring absolute top-[13px] right-[13px] flex size-[30px] cursor-pointer items-center justify-center rounded-full border border-border bg-[#2f1d15] text-cream"
        >
          <MaskIcon src="/icons/detail-zoom.svg" width={20} height={20} />
        </button>
      </div>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="p-3 sm:max-w-[min(90vw,800px)]">
          <DialogTitle className="sr-only">{nftName}</DialogTitle>
          <DialogDescription className="sr-only">{image.alt}</DialogDescription>
          <img
            src={image.largeUrl}
            alt={image.alt}
            width={800}
            height={800}
            className="max-h-[80dvh] w-full rounded-2xl object-contain"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Mobile: arte do hero e os indicadores, que também trocam a imagem. */
export function NftHeroImage({
  images,
  nftName,
  selected,
  onSelect,
}: GalleryProps) {
  const image = images[selected] ?? images[0]

  return (
    <div className="relative">
      <img
        src={image.largeUrl}
        alt={image.alt}
        width={800}
        height={800}
        fetchPriority="high"
        className="aspect-[361/356] w-full rounded-3xl object-cover"
      />
      {images.length > 1 && (
        <div
          role="group"
          aria-label={`Imagens de ${nftName}`}
          className="absolute inset-x-0 bottom-[50px] flex justify-center gap-[7px]"
        >
          {images.map((thumb, index) => (
            <button
              key={thumb.smallUrl}
              type="button"
              onClick={() => onSelect(index)}
              aria-current={index === selected}
              aria-label={`Mostrar imagem ${index + 1} de ${images.length}`}
              // Área de toque maior que o ponto de 7 px do Figma.
              className="focus-ring -m-2 flex cursor-pointer items-center justify-center rounded-full p-2"
            >
              <span
                className={cn(
                  'block h-[7px] rounded-full bg-primary transition-[width] motion-reduce:transition-none',
                  index === selected ? 'w-7' : 'w-[7px]',
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
