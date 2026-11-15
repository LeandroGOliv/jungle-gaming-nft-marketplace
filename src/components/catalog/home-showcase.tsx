import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { useFeaturedNfts } from '@/hooks/use-nfts'

const ORB =
  'absolute rounded-[29px] bg-[linear-gradient(145.46deg,rgba(210,138,76,0.3)_46.085%,rgba(210,138,76,0)_103.28%)]'

/**
 * "NFT em destaque" da sidebar (310 × 470): o primeiro destaque da curadoria,
 * vindo da API. Sem destaque (catálogo vazio ou falha), o bloco some — ele é
 * vitrine, não conteúdo de que a página dependa.
 */
export function FeaturedNftBanner() {
  const { data, isPending } = useFeaturedNfts()
  const nft = data?.items[0]

  if (!isPending && !nft) return null

  return (
    <section
      aria-labelledby="featured-nft-title"
      className="relative flex h-[470px] flex-col gap-4 overflow-hidden bg-[linear-gradient(to_bottom,rgba(210,138,76,0.1),rgba(210,138,76,0.03))] pt-6 pb-1"
    >
      <div className="flex flex-col gap-4">
        <h2
          id="featured-nft-title"
          className="px-5 text-2xl leading-8 font-bold text-text-accent"
        >
          NFT EM DESTAQUE
        </h2>
        <p className="px-5 text-center text-[22px] leading-4 font-bold text-foreground">
          OFERTA LIMITADA
        </p>
      </div>
      {nft ? (
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="focus-ring relative block h-[368px] rounded-[22px]"
        >
          <img
            src={nft.images[0].largeUrl}
            alt={nft.images[0].alt}
            width={310}
            height={368}
            loading="lazy"
            className="size-full rounded-[22px] object-cover"
          />
          <span className="sr-only">{nft.name}, ver detalhes</span>
        </Link>
      ) : (
        <Skeleton className="h-[368px] rounded-[22px]" />
      )}
      <span
        aria-hidden="true"
        className="absolute top-[299px] left-4 size-[22px] rounded-[7px] border-2 border-[#46a358] opacity-20"
      />
      <span
        aria-hidden="true"
        className={`${ORB} top-[343px] left-[248px] size-[45px]`}
      />
      <span
        aria-hidden="true"
        className={`${ORB} top-[105px] left-[38px] size-[15px]`}
      />
    </section>
  )
}

const PROMOS = [
  {
    title: ['Lançamentos gênesis', 'de edição limitada'],
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: 'emerald',
    busca: 'Genesis Drops',
  },
  {
    title: ['Arte digital selecionada', 'e muito mais'],
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: 'ivory',
    busca: 'Curated Art',
  },
] as const

/** Dois cards de 586 × 250; "Explorar" filtra o catálogo pela coleção. */
export function HomePromos() {
  return (
    <section aria-label="Promoções" className="grid gap-7 lg:grid-cols-2">
      {PROMOS.map((promo) => (
        <article
          key={promo.busca}
          className="relative flex min-h-[250px] overflow-hidden rounded-lg bg-card max-sm:flex-col"
        >
          <img
            src={`/images/nft-artwork-${promo.image}-800.webp`}
            alt=""
            width={292}
            height={250}
            loading="lazy"
            className="h-[250px] w-full shrink-0 rounded-[18px] object-cover sm:w-[292px]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-[142px] left-[-191px] size-64 rounded-full border-2 border-primary"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-[134px] left-[-199px] size-64 rounded-full border border-primary"
          />
          <div className="flex flex-1 flex-col items-end px-[30px] pt-[37px] pb-6 text-right">
            <h2 className="text-lg leading-6 font-bold text-foreground">
              {promo.title[0]}
              <br />
              {promo.title[1]}
            </h2>
            <p className="mt-[9px] max-w-[263px] text-sm leading-6 text-text-secondary">
              {promo.text}
            </p>
            <Link
              to="/"
              search={{ busca: promo.busca }}
              hash="catalogo"
              className="focus-ring mt-auto flex h-10 w-[140px] items-center justify-center gap-0 rounded-md bg-primary text-sm leading-5 font-medium text-ink hover:bg-primary/90 sm:mt-6"
            >
              Explorar
              <img src="/icons/arrow-right.svg" alt="" width={18} height={18} />
              <span className="sr-only">: {promo.busca}</span>
            </Link>
          </div>
        </article>
      ))}
    </section>
  )
}

const POSTS = [
  {
    meta: '12 de setembro  |  Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: 'ivory',
  },
  {
    meta: '13 de setembro  |  Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
    image: 'emerald',
  },
  {
    meta: '15 de setembro  |  Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: 'violet',
  },
  {
    meta: '15 de setembro  |  Leitura de 2 min',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: 'golden',
  },
] as const

/**
 * "Diário da Cunhagem": editorial, fora da entrega. "Ler mais" leva à página
 * que explica isso, em vez de simular um artigo.
 */
export function HomeBlog() {
  return (
    <section aria-labelledby="blog-title" className="flex flex-col gap-10">
      <header className="flex flex-col items-center gap-3 text-center">
        <h2
          id="blog-title"
          className="text-[28px] leading-[37px] font-bold text-foreground"
        >
          Diário da Cunhagem
        </h2>
        <p className="text-sm leading-[18px] text-text-secondary">
          Histórias, guias e insights para colecionadores sobre o universo da
          propriedade digital.
        </p>
      </header>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(4,268px)]">
        {POSTS.map((post) => (
          <li key={post.title}>
            <article className="relative flex h-full flex-col overflow-hidden rounded-lg bg-card">
              <img
                src={`/images/nft-artwork-${post.image}-400.webp`}
                alt=""
                width={268}
                height={195}
                loading="lazy"
                className="h-[195px] w-full object-cover"
              />
              <div className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-4">
                <p className="text-xs leading-4 font-medium whitespace-pre-wrap text-text-secondary">
                  {post.meta}
                </p>
                <h3 className="text-base leading-[21px] font-bold text-foreground">
                  {post.title}
                </h3>
                <p className="text-xs leading-4 font-medium text-text-secondary">
                  {post.excerpt}
                </p>
                <Link
                  to="/em-breve"
                  search={{ secao: 'diario-da-cunhagem' }}
                  className="focus-ring flex gap-1 self-start rounded-sm text-xs leading-4 text-text-accent after:absolute after:inset-0 after:content-['']"
                >
                  <span className="font-bold">Ler mais</span>
                  <span aria-hidden="true">→</span>
                  <span className="sr-only">: {post.title}</span>
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
