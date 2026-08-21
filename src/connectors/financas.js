import { ConnectorNotImplementedError } from './base.js';

export const name = 'financas';

/**
 * Portal das Finanças / e-Fatura has no public API for individual taxpayers — only
 * AT-certified software gets webservice + certificate access. This adapter is meant
 * to replay the caller's own already-authenticated portal session (a cookie they
 * capture themselves after logging in in their own browser), never a password.
 *
 * It's intentionally left unimplemented: the actual request/response contract
 * (which faturas.gov.pt endpoint, what headers besides the cookie, what shape the
 * response comes back in) isn't reliably known and changes without notice. Hardcoding
 * a guess here would risk silently doing nothing or grabbing the wrong thing. To
 * finish this, capture one real authenticated request from your own logged-in
 * session (e.g. via browser devtools' Network tab, or by walking through the portal
 * with a browser automation tool while you stay logged in yourself) and fill in the
 * fields below.
 */
export async function fetchAndNormalize(_cookieValue) {
  throw new ConnectorNotImplementedError('financas', {
    portal: 'https://faturas.gov.pt (Portal das Finanças / e-Fatura)',
    capture: [
      'Log in to the portal yourself in a normal browser.',
      'Open DevTools → Network, navigate to the invoice listing (e-Fatura) you want synced.',
      'Copy: the exact request URL, its query params, all request headers (especially the session cookie name/value), and a sample of the JSON/HTML response body.',
      'Hand those to whoever finishes this adapter — do NOT share your NIF password or Chave Móvel Digital, only the session cookie value and the request/response shape.'
    ]
  });
}
