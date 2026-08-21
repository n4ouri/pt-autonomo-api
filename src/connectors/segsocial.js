import { ConnectorNotImplementedError } from './base.js';

export const name = 'segsocial';

/**
 * Segurança Social Direta has no public API either. Same model as financas.js: this
 * adapter is meant to replay the caller's own already-authenticated session cookie,
 * never a password, and is intentionally left unimplemented until a real request is
 * captured — see financas.js for why guessing the contract here would be worse than
 * shipping an honest stub.
 */
export async function fetchAndNormalize(_cookieValue) {
  throw new ConnectorNotImplementedError('segsocial', {
    portal: 'https://app.seg-social.pt (Segurança Social Direta)',
    capture: [
      'Log in to the portal yourself in a normal browser.',
      'Open DevTools → Network, navigate to your quarterly declarations / contribution history.',
      'Copy: the exact request URL, its query params, all request headers (especially the session cookie name/value), and a sample of the JSON/HTML response body.',
      'Hand those to whoever finishes this adapter — do NOT share your Cartão de Cidadão/Chave Móvel Digital credentials, only the session cookie value and the request/response shape.'
    ]
  });
}
