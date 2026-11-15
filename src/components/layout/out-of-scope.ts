/**
 * Seções do layout que não fazem parte da entrega (editoriais, suporte,
 * atividade, ofertas, downloads). Os links levam a `/em-breve?secao=<id>`,
 * que explica isso em vez de simular uma página funcional.
 */
export const OUT_OF_SCOPE_SECTION_IDS = [
  'criadores',
  'aprenda',
  'favoritos',
  'minha-colecao',
  'atividade',
  'estudio-do-criador',
  'lista-de-interesse',
  'central-de-ajuda',
  'como-comprar',
  'carteira-e-seguranca',
  'politica-do-mercado',
  'denunciar-item',
  'arte-3d',
  'utilidade',
  'diario-da-cunhagem',
] as const

export type OutOfScopeSection = (typeof OUT_OF_SCOPE_SECTION_IDS)[number]

export const OUT_OF_SCOPE_SECTIONS: Record<OutOfScopeSection, string> = {
  criadores: 'Criadores',
  aprenda: 'Aprenda',
  favoritos: 'Favoritos',
  'minha-colecao': 'Minha coleção',
  atividade: 'Atividade',
  'estudio-do-criador': 'Estúdio do criador',
  'lista-de-interesse': 'Lista de interesse',
  'central-de-ajuda': 'Central de ajuda',
  'como-comprar': 'Como comprar NFTs',
  'carteira-e-seguranca': 'Carteira e segurança',
  'politica-do-mercado': 'Política do mercado',
  'denunciar-item': 'Denunciar item',
  'arte-3d': 'Arte 3D',
  utilidade: 'Utilidade',
  'diario-da-cunhagem': 'Diário da Cunhagem',
}
