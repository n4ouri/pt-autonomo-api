import express from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createTransaction } from '../db/transactions.js';
import { parseBankCsv, parseBankOfx } from '../connectors/bankStatement.js';

export const router = express.Router();

router.use('/me/import', requireAuth);

const importLimiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

const importBodySchema = z.object({
  format: z.enum(['csv', 'ofx']),
  content: z.string().min(1, 'content is required — the raw text of your CSV or OFX export.'),
  delimiter: z.string().length(1).optional()
});

router.post('/me/import/bank-statement', importLimiter, validateBody(importBodySchema), (req, res, next) => {
  try {
    const { format, content, delimiter } = req.body;
    const rows = format === 'csv' ? parseBankCsv(content, delimiter ? { delimiter } : undefined) : parseBankOfx(content);
    const created = rows.map((row) => createTransaction(req.profile.id, row));
    res.status(201).json({ status: 'success', data: { transactionsCreated: created.length, transactions: created } });
  } catch (err) {
    next(err);
  }
});
