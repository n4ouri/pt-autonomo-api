import express from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { encryptCookie, decryptCookie } from '../lib/cookieVault.js';
import {
  listConnectorStatuses,
  upsertConnectorSession,
  getConnectorSessionRaw,
  recordSyncResult,
  deleteConnectorSession
} from '../db/connectorSessions.js';
import { createTransaction } from '../db/transactions.js';
import { upsertStatus } from '../db/obligationStatus.js';
import { ConnectorNotImplementedError } from '../connectors/base.js';
import * as financas from '../connectors/financas.js';
import * as segsocial from '../connectors/segsocial.js';

export const router = express.Router();

router.use('/me/connectors', requireAuth);

const ADAPTERS = { financas, segsocial };
const PROVIDERS = Object.keys(ADAPTERS);
const SYNC_COOLDOWN_MS = 15 * 60 * 1000;

const providerParamSchema = z.enum(PROVIDERS);

const sessionLimiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const syncLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

const putSessionSchema = z.object({
  cookie: z.string().min(1, 'cookie is required — paste the value of your own already-authenticated session cookie.'),
  label: z.string().max(200).optional()
});

function requireValidProvider(req, res, next) {
  const result = providerParamSchema.safeParse(req.params.provider);
  if (!result.success) {
    return res.status(400).json({ status: 'error', message: `Unknown provider. Expected one of: ${PROVIDERS.join(', ')}.` });
  }
  next();
}

router.get('/me/connectors', (req, res) => {
  const statuses = listConnectorStatuses(req.profile.id);
  const byProvider = Object.fromEntries(statuses.map((s) => [s.provider, s]));
  const data = PROVIDERS.map((provider) => byProvider[provider] ?? { provider, capturedAt: null, lastSyncedAt: null, lastSyncStatus: null });
  res.json({ status: 'success', data });
});

router.put('/me/connectors/:provider/session', sessionLimiter, requireValidProvider, validateBody(putSessionSchema), (req, res) => {
  const cookieEnc = encryptCookie(req.body.cookie);
  const session = upsertConnectorSession(req.profile.id, req.params.provider, { cookieEnc, label: req.body.label });
  res.status(201).json({
    status: 'success',
    data: session,
    warning: 'Your cookie is stored encrypted at rest and never returned by this API. It is only as trustworthy as your own machine — treat it like a password.'
  });
});

router.delete('/me/connectors/:provider/session', requireValidProvider, (req, res) => {
  const deleted = deleteConnectorSession(req.profile.id, req.params.provider);
  if (!deleted) return res.status(404).json({ status: 'error', message: 'No stored session for this provider.' });
  res.status(204).end();
});

router.post('/me/connectors/:provider/sync', syncLimiter, requireValidProvider, async (req, res, next) => {
  const provider = req.params.provider;
  const raw = getConnectorSessionRaw(req.profile.id, provider);
  if (!raw) {
    return res.status(400).json({ status: 'error', message: `No session cookie stored for "${provider}". PUT /me/connectors/${provider}/session first.` });
  }

  if (raw.lastSyncedAt) {
    const elapsed = Date.now() - new Date(raw.lastSyncedAt).getTime();
    if (elapsed < SYNC_COOLDOWN_MS) {
      const retryAfterSec = Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({ status: 'error', message: `Synced too recently — to avoid hammering the ${provider} portal, wait ${retryAfterSec}s before retrying.` });
    }
  }

  try {
    const cookieValue = decryptCookie(raw.cookieEnc);
    const { fetchAndNormalize } = ADAPTERS[provider];
    const result = await fetchAndNormalize(cookieValue);

    const created = result.transactions.map((t) => createTransaction(req.profile.id, { ...t, source: provider }));
    for (const update of result.obligationUpdates ?? []) {
      upsertStatus(req.profile.id, update.obligationKey, update);
    }

    recordSyncResult(req.profile.id, provider, 'success');
    res.json({ status: 'success', data: { transactionsCreated: created.length, obligationsUpdated: (result.obligationUpdates ?? []).length } });
  } catch (err) {
    recordSyncResult(req.profile.id, provider, err instanceof ConnectorNotImplementedError ? 'not_implemented' : 'error');
    if (err instanceof ConnectorNotImplementedError) {
      return res.status(err.status).json({ status: 'error', message: err.message, needed: err.needed });
    }
    next(err);
  }
});
