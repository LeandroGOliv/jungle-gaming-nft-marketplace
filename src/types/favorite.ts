/**
 * `GET /favorites`, e também a resposta de `PUT` e `DELETE
 * /favorites/:nftId`: a lista completa do usuário após a operação.
 */
export interface FavoritesResponse {
  nftIds: Array<string>
}
