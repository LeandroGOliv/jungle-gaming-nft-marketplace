import { NETWORK_LABELS } from '@/components/catalog/labels'
import type { Nft } from '@/types/nft'
import { formatPercent, shortenAddress } from '@/utils/nft-detail'

/**
 * Aba "Detalhes do NFT". As avaliações estão fora do escopo: a aba aparece
 * como no Figma, mas desabilitada, sem simular conteúdo.
 */
export function NftDescription({ nft }: { nft: Nft }) {
  const network = NETWORK_LABELS[nft.network]
  const facts = [
    {
      term: 'Rede',
      detail: `Cunhado na ${network} com procedência imutável e metadados armazenados no IPFS.`,
    },
    {
      term: 'Contrato',
      detail: `${shortenAddress(nft.contractAddress)} • Contrato inteligente ERC-721 verificado.`,
    },
    {
      term: 'Direitos autorais',
      detail: `Direitos autorais do criador: ${formatPercent(nft.royaltyPercent)} nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.`,
    },
  ]

  return (
    <section aria-labelledby="nft-details-tab" className="flex flex-col gap-3">
      <div
        role="tablist"
        aria-label="Informações do NFT"
        className="flex gap-8 overflow-x-auto border-b border-primary/30"
      >
        <button
          type="button"
          role="tab"
          id="nft-details-tab"
          aria-selected="true"
          aria-controls="nft-details-panel"
          className="focus-ring -mb-px shrink-0 border-b-[3px] border-primary pb-3 text-[17px] leading-4 font-bold text-text-accent"
        >
          Detalhes do NFT
        </button>
        <button
          type="button"
          role="tab"
          aria-selected="false"
          aria-disabled="true"
          tabIndex={-1}
          title="Avaliações indisponíveis nesta versão"
          className="shrink-0 cursor-not-allowed pb-3 text-[17px] leading-4 text-cream"
        >
          Avaliações de colecionadores ({nft.reviewCount})
        </button>
      </div>

      <div
        role="tabpanel"
        id="nft-details-panel"
        aria-labelledby="nft-details-tab"
        className="flex flex-col gap-3 text-sm leading-6 text-text-secondary"
      >
        <div className="flex flex-col gap-6">
          {nft.description.split('\n\n').map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <dl className="flex flex-col gap-3">
          {facts.map((fact) => (
            <div key={fact.term}>
              <dt className="font-bold text-cream">{fact.term}:</dt>
              <dd>{fact.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
