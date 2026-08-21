/**
 * A connector adapter turns an authenticated session (or a file, for bankStatement)
 * into normalized rows the ledger already understands. `fetchAndNormalize` must
 * return { transactions: [...], obligationUpdates: [...] } — transactions match the
 * shape accepted by db/transactions.js::createTransaction (with `source` preset),
 * obligationUpdates match db/obligationStatus.js::upsertStatus.
 */
export class ConnectorNotImplementedError extends Error {
  constructor(provider, needed) {
    super(`The ${provider} connector isn't implemented yet — no verified scraping contract exists for it.`);
    this.status = 501;
    this.provider = provider;
    this.needed = needed;
  }
}
