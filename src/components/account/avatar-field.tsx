import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { describeAvatarFileError } from '@/utils/avatar-file'
import { AVATAR_MIME_TYPES } from '@/types/user'
import type { AvatarChange } from '@/hooks/use-profile'

interface AvatarFieldProps {
  /** Avatar confirmado pela API. */
  currentUrl: string | null
  change: AvatarChange
  onChange: (change: AvatarChange) => void
  error?: string
  onError: (message: string | undefined) => void
  disabled?: boolean
}

/** Pré-visualização do arquivo escolhido, liberada quando ele sai de cena. */
function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])
  return url
}

/**
 * "Avatar" do Figma: círculo de 50 px, "Alterar" (abre o seletor) e "Remover".
 * A troca só vale depois do "Salvar"; até lá, o círculo mostra a prévia.
 */
export function AvatarField({
  currentUrl,
  change,
  onChange,
  error,
  onError,
  disabled,
}: AvatarFieldProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrl = useObjectUrl(change.kind === 'upload' ? change.file : null)
  const shownUrl =
    change.kind === 'upload'
      ? previewUrl
      : change.kind === 'remove'
        ? null
        : currentUrl
  const status =
    change.kind === 'upload'
      ? `Nova imagem selecionada: ${change.file.name}. Será enviada ao salvar.`
      : change.kind === 'remove'
        ? 'O avatar será removido ao salvar.'
        : currentUrl
          ? 'Avatar atual.'
          : 'Sem avatar.'

  const pick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    // Libera o mesmo arquivo para ser escolhido de novo depois de um erro.
    event.target.value = ''
    if (!file) return
    const invalid = describeAvatarFileError(file)
    onError(invalid ?? undefined)
    if (!invalid) onChange({ kind: 'upload', file })
  }

  const canRemove =
    change.kind === 'upload' || (change.kind === 'keep' && currentUrl !== null)

  return (
    <div
      role="group"
      aria-labelledby={`${id}-rotulo`}
      aria-describedby={cn(`${id}-estado`, error && `${id}-erro`)}
      className="flex min-w-0 flex-col gap-2.5"
    >
      <span
        id={`${id}-rotulo`}
        className="text-[15px] leading-[15px] text-foreground"
      >
        Avatar
      </span>
      <div className="flex items-center gap-6">
        <span className="grid size-[50px] shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-[#2f1d15]">
          {shownUrl ? (
            <img
              src={shownUrl}
              alt="Pré-visualização do avatar"
              className="size-full object-cover"
            />
          ) : (
            <img
              src="/icons/profile-avatar-image.svg"
              alt=""
              width={24}
              height={24}
            />
          )}
        </span>
        <div className="flex items-center gap-5">
          <Button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="h-10 w-[98px] rounded-[3px] text-sm leading-4 font-bold text-ink hover:bg-primary/90"
          >
            Alterar
            <span className="sr-only"> avatar</span>
          </Button>
          <button
            type="button"
            disabled={disabled || !canRemove}
            onClick={() => {
              onError(undefined)
              onChange(
                change.kind === 'upload'
                  ? { kind: 'keep' }
                  : { kind: 'remove' },
              )
            }}
            className="focus-ring cursor-pointer rounded-sm text-sm leading-4 text-foreground hover:text-text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {change.kind === 'upload' ? 'Descartar' : 'Remover'}
            <span className="sr-only"> avatar</span>
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_MIME_TYPES.join(',')}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          data-testid="avatar-input"
          onChange={pick}
        />
      </div>
      <p id={`${id}-estado`} className="sr-only" aria-live="polite">
        {status}
      </p>
      {error && (
        <p id={`${id}-erro`} className="text-[13px] leading-4 text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
