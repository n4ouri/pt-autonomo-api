import express from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { createTransaction, listTransactions, updateTransaction, deleteTransaction } from '../db/transactions.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';

export const router = express.Router();

router.use('/me/transactions', requireAuth);

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false
});

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const incomeCategory = z.enum(['SERVICOS_PROFISSIONAIS', 'OUTROS_SERVICOS', 'VENDAS_MERCADORIAS']);

const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  date: dateString,
  amount: z.number().positive(),
  category: z.string().min(1).max(100),
  vatRate: z.number().min(0).max(1).default(0),
  counterpartyNIF: z.string().regex(/^\d{9}$/).optional(),
  description: z.string().max(500).optional(),
  isJustifiedExpense: z.boolean().default(false)
}).superRefine((val, ctx) => {
  if (val.type === 'income' && !incomeCategory.safeParse(val.category).success) {
    ctx.addIssue({
      code: 'custom',
      path: ['category'],
      message: `Income category must be one of: ${incomeCategory.options.join(', ')} (drives the CIRS/SS coefficient).`
    });
  }
});

const updateTransactionSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  date: dateString.optional(),
  amount: z.number().positive().optional(),
  category: z.string().min(1).max(100).optional(),
  vatRate: z.number().min(0).max(1).optional(),
  counterpartyNIF: z.string().regex(/^\d{9}$/).optional(),
  description: z.string().max(500).optional(),
  isJustifiedExpense: z.boolean().optional()
});

const listQuerySchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().optional()
});

router.post('/me/transactions', writeLimiter, validateBody(createTransactionSchema), (req, res) => {
  const transaction = createTransaction(req.profile.id, req.body);
  res.status(201).json({ status: 'success', data: transaction });
});

router.get('/me/transactions', validateQuery(listQuerySchema), (req, res) => {
  const transactions = listTransactions(req.profile.id, req.query);
  res.json({ status: 'success', data: transactions });
});

router.patch('/me/transactions/:id', writeLimiter, validateBody(updateTransactionSchema), (req, res) => {
  const updated = updateTransaction(req.profile.id, req.params.id, req.body);
  if (!updated) return res.status(404).json({ status: 'error', message: 'Transaction not found.' });
  res.json({ status: 'success', data: updated });
});

router.delete('/me/transactions/:id', writeLimiter, (req, res) => {
  const deleted = deleteTransaction(req.profile.id, req.params.id);
  if (!deleted) return res.status(404).json({ status: 'error', message: 'Transaction not found.' });
  res.status(204).end();
});
