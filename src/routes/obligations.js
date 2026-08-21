import express from 'express';
import { z } from 'zod';
import { generateObligations } from '../engines/obligations-engine.js';
import { getStatusMap, upsertStatus } from '../db/obligationStatus.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { withGuidance } from '../lib/guidance.js';

export const router = express.Router();

router.use('/me/obligations', requireAuth);

function withStatus(profileId, items) {
  const statusMap = getStatusMap(profileId);
  return items.map((item) => {
    const stored = statusMap.get(item.obligationKey);
    return {
      ...item,
      status: stored?.status ?? 'pending',
      amountPaid: stored?.amountPaid ?? null,
      paidDate: stored?.paidDate ?? null,
      notes: stored?.notes ?? null
    };
  });
}

const listQuerySchema = z.object({
  upcomingDays: z.coerce.number().int().positive().max(3650).optional()
});

router.get('/me/obligations', validateQuery(listQuerySchema), (req, res) => {
  const items = withStatus(req.profile.id, generateObligations(req.profile));
  const filtered = req.query.upcomingDays != null
    ? items.filter((i) => i.daysUntilDue <= req.query.upcomingDays)
    : items;

  res.json(withGuidance('obligations', { status: 'success', data: filtered }));
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'paid']),
  amountPaid: z.number().positive().optional(),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(500).optional()
});

router.patch('/me/obligations/:key', validateBody(updateStatusSchema), (req, res) => {
  const known = generateObligations(req.profile).some((o) => o.obligationKey === req.params.key);
  if (!known) return res.status(404).json({ status: 'error', message: 'Unknown obligationKey for this profile.' });

  const updated = upsertStatus(req.profile.id, req.params.key, req.body);
  res.json({ status: 'success', data: updated });
});
