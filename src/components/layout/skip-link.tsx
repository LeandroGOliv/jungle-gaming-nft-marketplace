export const MAIN_CONTENT_ID = 'conteudo'

export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="fixed top-2 left-2 z-50 -translate-y-24 rounded-md bg-primary px-4 py-2 text-base font-medium text-ink transition-transform focus-visible:translate-y-0 focus-visible:ring-3 focus-visible:ring-foreground focus-visible:outline-none motion-reduce:transition-none"
    >
      Pular para o conteúdo
    </a>
  )
}
