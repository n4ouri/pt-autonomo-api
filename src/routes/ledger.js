import express from 'express';
import { z } from 'zod';
import { getLedgerSummary } from '../engines/ledger-engine.js';
import { requireAuth } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validate.js';

export const router = express.Router();

const summaryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  quarter: z.coerce.number().int().min(1).max(4).optional()
});

router.get('/me/ledger/summary', requireAuth, validateQuery(summaryQuerySchema), (req, res) => {
  const summary = getLedgerSummary(req.profile.id, req.query);
  res.json({ status: 'success', data: summary });
});
