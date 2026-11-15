import { Link } from '@tanstack/react-router'
import { NewsletterForm } from './newsletter-form'
import { PageContainer } from './page-container'
import type { LinkProps } from '@tanstack/react-router'
import type { OutOfScopeSection } from './out-of-scope'
import type { NftCategory } from '@/types/nft'

const FEATURES = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

interface FooterLink {
  label: string
  link: LinkProps
}

function comingSoon(label: string, secao: OutOfScopeSection): FooterLink {
  return { label, link: { to: '/em-breve', search: { secao } } }
}

function category(label: string, categoria: NftCategory): FooterLink {
  return { label, link: { to: '/', search: { categoria } } }
}

const LINK_COLUMNS: Array<{ title: string; links: Array<FooterLink> }> = [
  {
    title: 'Meu perfil',
    links: [
      { label: 'Meu perfil', link: { to: '/perfil' } },
      comingSoon('Minha coleção', 'minha-colecao'),
      comingSoon('Atividade', 'atividade'),
      comingSoon('Estúdio do criador', 'estudio-do-criador'),
      comingSoon('Lista de interesse', 'lista-de-interesse'),
    ],
  },
  {
    title: 'Central de ajuda',
    links: [
      comingSoon('Central de ajuda', 'central-de-ajuda'),
      comingSoon('Como comprar NFTs', 'como-comprar'),
      comingSoon('Carteira e segurança', 'carteira-e-seguranca'),
      comingSoon('Política do mercado', 'politica-do-mercado'),
      comingSoon('Denunciar item', 'denunciar-item'),
    ],
  },
  {
    title: 'Coleções',
    links: [
      category('Arte digital', 'art'),
      category('Fotografia', 'photography'),
      category('Música', 'music'),
      comingSoon('Arte 3D', 'arte-3d'),
      comingSoon('Utilidade', 'utilidade'),
    ],
  },
]

const SOCIAL_LINKS = [
  { name: 'Facebook', href: 'https://www.facebook.com/', icon: 'facebook' },
  { name: 'Instagram', href: 'https://www.instagram.com/', icon: 'instagram' },
  { name: 'X (Twitter)', href: 'https://x.com/', icon: 'twitter' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/', icon: 'linkedin' },
  { name: 'YouTube', href: 'https://www.youtube.com/', icon: 'youtube' },
]

const linkClass =
  'focus-ring rounded-sm underline-offset-4 hover:text-text-accent hover:underline'

/** Footer comum às telas a partir de 768 px (no mobile a navegação fica na barra de abas); abaixo de 1024 px as faixas empilham. */
export function SiteFooter() {
  return (
    <footer className="pt-16 pb-6 max-md:hidden lg:pt-24">
      <PageContainer>
        <h2 className="sr-only">Rodapé</h2>

        {/* No Figma a faixa tem 250 px e a linha de 1154 px avança 18 px sobre
            o padding direito de 32; o conteúdo termina 16 px antes da base. */}
        <div className="grid grid-cols-1 gap-8 bg-card p-6 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:items-end lg:justify-between lg:gap-0 lg:pt-8 lg:pr-3.5 lg:pb-4 lg:pl-8">
          {FEATURES.map((feature, index) => (
            <div key={feature.letter} className="contents">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="hidden w-px self-stretch bg-primary lg:block"
                />
              )}
              <section
                aria-labelledby={`footer-feature-${feature.letter}`}
                className={
                  index === 0
                    ? 'flex flex-col gap-3 lg:flex-1 lg:px-4'
                    : 'flex flex-col gap-3 lg:w-[264.667px] lg:px-4'
                }
              >
                <span
                  aria-hidden="true"
                  className="grid size-[74px] place-items-center rounded-full bg-primary text-2xl leading-[normal] font-bold text-ink"
                >
                  {feature.letter}
                </span>
                <h3
                  id={`footer-feature-${feature.letter}`}
                  className="text-[17px] leading-5 font-bold lg:leading-4 text-foreground"
                >
                  {feature.title}
                </h3>
                <p className="text-sm leading-5.5 text-text-secondary lg:w-[204px]">
                  {feature.text}
                </p>
              </section>
            </div>
          ))}
          <span
            aria-hidden="true"
            className="hidden w-px self-stretch bg-primary lg:block"
          />
          <div className="sm:col-span-full lg:w-[357px] lg:self-stretch lg:px-4">
            <NewsletterForm />
          </div>
        </div>

        <div className="grid grid-cols-1 items-center gap-4 bg-surface-dark p-6 text-sm leading-5.5 text-foreground sm:grid-cols-2 lg:flex lg:h-[88px] lg:gap-[92px] lg:px-8">
          <p className="py-2 leading-[normal] font-bold tracking-widest lg:flex-1">
            KURIO
          </p>
          <p className="lg:flex-1 lg:whitespace-nowrap">
            Feito para colecionadores,
            <br />
            criadores e cultura
          </p>
          <p className="lg:flex-1">
            <a href="mailto:contato@email.com" className={linkClass}>
              contato@email.com
            </a>
          </p>
          <p className="lg:w-[228px]">
            <a href="tel:+551140028922" className={linkClass}>
              +55 11 4002 8922
            </a>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-8 bg-card p-6 text-foreground md:grid-cols-3 lg:flex lg:gap-[124px] lg:p-8">
          {LINK_COLUMNS.map((column) => (
            <nav
              key={column.title}
              aria-label={column.title}
              className="flex flex-col gap-2 lg:flex-1"
            >
              <h3 className="text-lg leading-5 font-bold lg:leading-4">
                {column.title}
              </h3>
              <ul className="text-sm">
                {column.links.map((item) => (
                  // Itens de 30 px como no Figma, com quebra compacta no mobile.
                  <li key={item.label} className="py-[5px] leading-5">
                    <Link {...item.link} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-full flex flex-col gap-8 lg:w-[228px]">
            <section
              aria-labelledby="footer-social"
              className="flex flex-col gap-5"
            >
              <h3
                id="footer-social"
                className="text-lg leading-5 font-bold lg:leading-4"
              >
                Redes sociais
              </h3>
              <ul className="flex gap-2.5">
                {SOCIAL_LINKS.map((social) => (
                  <li key={social.icon}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${social.name} (abre em nova aba)`}
                      className="focus-ring relative block size-[30px] rounded-[4.5px] hover:opacity-80"
                    >
                      <img
                        src={`/icons/social-${social.icon}.svg`}
                        alt=""
                        width={32}
                        height={32}
                        className="absolute -inset-px size-8 max-w-none"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
            <section
              aria-labelledby="footer-wallets"
              className="flex flex-col gap-3"
            >
              <h3
                id="footer-wallets"
                className="text-lg leading-5 font-bold lg:leading-4"
              >
                Carteiras compatíveis
              </h3>
              <p className="flex h-[26px] items-center justify-center rounded-md border border-border-soft bg-surface-dark px-2 text-[9px] leading-[normal] font-bold tracking-[0.1px] whitespace-pre text-text-accent">
                {'METAMASK  •  WALLETCONNECT  •  COINBASE'}
              </p>
            </section>
          </div>
        </div>

        <p className="mt-1.5 text-center text-sm leading-7.5 text-foreground">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </PageContainer>
    </footer>
  )
}
