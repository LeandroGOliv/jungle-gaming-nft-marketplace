/** Três pontos do Figma; decorativos, já que o hero não é um carrossel. */
function Dots({ size }: { size: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={size === 'md' ? 'flex gap-2' : 'flex gap-1.5'}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={
            size === 'md'
              ? 'size-2 rounded-full bg-primary'
              : 'size-[7px] rounded-full bg-primary'
          }
        />
      ))}
    </span>
  )
}

/** Hero da Início: "Top / Hero" no desktop e "Hero Banner" no mobile. */
export function HomeHero() {
  return (
    // Um h1 por variante: só a visível no viewport chega à árvore de acessibilidade.
    <section>
      {/* Mobile: banner de 366 × 190. */}
      <div className="relative overflow-hidden rounded-xl bg-[linear-gradient(135deg,rgba(237,237,237,0.2),rgba(237,237,237,0.1))] p-4 md:hidden">
        <span
          aria-hidden="true"
          className="absolute top-[-31px] left-[-80px] size-[248px] rounded-full bg-[linear-gradient(150deg,rgba(221,154,95,0.43),rgba(210,138,76,0.04))] opacity-40"
        />
        <span
          aria-hidden="true"
          className="absolute top-[-10px] left-[73px] size-[248px] rounded-full bg-[linear-gradient(150deg,rgba(221,154,95,0.37),rgba(210,138,76,0))] opacity-40"
        />
        <div className="relative flex flex-col items-center gap-4">
          <div className="flex w-full items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs leading-4 font-medium text-foreground">
                  Bem-vindo à Kurio
                </p>
                <h1 className="text-lg leading-[29px] font-bold text-foreground">
                  SEJA DONO DA
                  <br />
                  CULTURA DIGITAL
                </h1>
                <p className="text-xs leading-[18px] text-text-secondary">
                  Descubra NFTs selecionados de criadores do mundo todo.
                </p>
              </div>
              <a
                href="#catalogo"
                className="focus-ring flex items-center gap-2 self-start rounded-sm text-xs leading-[14px] font-bold text-text-accent"
              >
                EXPLORAR
                <img
                  src="/icons/arrow-right-accent.svg"
                  alt=""
                  width={16}
                  height={16}
                />
              </a>
            </div>
            <div aria-hidden="true" className="relative size-[138px] shrink-0">
              <img
                src="/images/nft-artwork-emerald-400.webp"
                alt=""
                width={138}
                height={138}
                className="size-[138px] rounded-2xl object-cover"
              />
              <img
                src="/images/nft-artwork-violet-400.webp"
                alt=""
                width={58}
                height={58}
                className="absolute top-[88px] left-[14px] size-[58px] rounded-2xl object-cover"
              />
            </div>
          </div>
          <Dots size="sm" />
        </div>
      </div>

      {/* Desktop: 1200 × 450, texto à esquerda e arte de 450 × 450. */}
      <div className="hidden items-center justify-between gap-10 md:flex lg:gap-[110px] lg:pl-10">
        <div className="flex max-w-[600px] min-w-0 flex-1 flex-col items-end gap-11">
          <div className="flex w-full flex-col gap-8">
            <div className="flex flex-col gap-1">
              <div className="flex flex-col gap-2">
                <p className="text-sm leading-4 font-medium tracking-[0.1em] text-foreground">
                  Bem-vindo à Kurio
                </p>
                <h1 className="text-[26px] leading-[44px] font-bold text-foreground lg:text-[43px] lg:leading-[70px]">
                  SEJA DONO DO FUTURO
                  <br />
                  DA ARTE DIGITAL
                </h1>
              </div>
              <p className="max-w-[557px] text-sm leading-6 text-text-secondary">
                Descubra NFTs selecionados de criadores emergentes e
                consagrados. Colecione arte digital rara, apoie artistas e tenha
                uma parte da cultura da internet.
              </p>
            </div>
            <a
              href="#catalogo"
              className="focus-ring flex h-10 w-[140px] items-center justify-center rounded-md bg-primary pr-9 pl-7 text-base leading-5 font-bold text-ink hover:bg-primary/90"
            >
              EXPLORAR
            </a>
          </div>
          <Dots size="md" />
        </div>
        <img
          src="/images/nft-artwork-emerald-800.webp"
          alt="Retrato ilustrado de um macaco com jaqueta college verde e óculos redondos"
          width={450}
          height={450}
          fetchPriority="high"
          className="aspect-square w-[45%] max-w-[450px] shrink-0 rounded-3xl object-cover"
        />
      </div>
    </section>
  )
}
