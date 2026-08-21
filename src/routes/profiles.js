import express from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { createProfile, updateProfile } from '../db/profiles.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { withGuidance } from '../lib/guidance.js';

export const router = express.Router();

const createProfileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

const createProfileSchema = z.object({
  name: z.string().min(1).max(200),
  nif: z.string().regex(/^\d{9}$/, 'NIF must be 9 digits').optional(),
  activityStartDate: dateString.optional(),
  regimeIVA: z.enum(['isento', 'trimestral', 'mensal']).default('isento'),
  serviceType: z.enum(['SERVICOS_PROFISSIONAIS', 'OUTROS_SERVICOS', 'VENDAS_MERCADORIAS']).default('SERVICOS_PROFISSIONAIS')
});

/**
 * Creates an autónomo profile — the persistent identity everything else (ledger,
 * obligations, dashboard) hangs off. Returns the API key exactly once.
 */
router.post('/profiles', createProfileLimiter, validateBody(createProfileSchema), (req, res) => {
  const { profile, apiKey } = createProfile(req.body);
  res.status(201).json(withGuidance('dashboard', {
    status: 'success',
    data: {
      profile,
      apiKey,
      warning: 'Store this API key now — it is not recoverable and will not be shown again. Send it as "Authorization: Bearer <apiKey>" on every /api/v1/me/* request.'
    }
  }));
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  nif: z.string().regex(/^\d{9}$/, 'NIF must be 9 digits').optional(),
  activityStartDate: dateString.optional(),
  regimeIVA: z.enum(['isento', 'trimestral', 'mensal']).optional(),
  serviceType: z.enum(['SERVICOS_PROFISSIONAIS', 'OUTROS_SERVICOS', 'VENDAS_MERCADORIAS']).optional()
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ status: 'success', data: req.profile });
});

router.patch('/me', requireAuth, validateBody(updateProfileSchema), (req, res) => {
  const updated = updateProfile(req.profile.id, req.body);
  res.json({ status: 'success', data: updated });
});
