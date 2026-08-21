import crypto from 'crypto';
import { getDb } from './index.js';

export function getStatusMap(profileId) {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM obligation_status WHERE profileId = ?`).all(profileId);
  const map = new Map();
  for (const row of rows) map.set(row.obligationKey, row);
  return map;
}

export function upsertStatus(profileId, obligationKey, updates) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM obligation_status WHERE profileId = ? AND obligationKey = ?`).get(profileId, obligationKey);
  const now = new Date().toISOString();

  if (existing) {
    const merged = {
      id: existing.id,
      status: updates.status ?? existing.status,
      amountPaid: updates.amountPaid ?? existing.amountPaid,
      paidDate: updates.paidDate ?? existing.paidDate,
      notes: updates.notes ?? existing.notes,
      updatedAt: now
    };
    db.prepare(`
      UPDATE obligation_status SET status=@status, amountPaid=@amountPaid, paidDate=@paidDate, notes=@notes, updatedAt=@updatedAt
      WHERE id=@id
    `).run(merged);
    return db.prepare(`SELECT * FROM obligation_status WHERE id = ?`).get(existing.id);
  }

  const row = {
    id: crypto.randomUUID(),
    profileId,
    obligationKey,
    status: updates.status ?? 'pending',
    amountPaid: updates.amountPaid ?? null,
    paidDate: updates.paidDate ?? null,
    notes: updates.notes ?? null,
    updatedAt: now
  };

  db.prepare(`
    INSERT INTO obligation_status (id, profileId, obligationKey, status, amountPaid, paidDate, notes, updatedAt)
    VALUES (@id, @profileId, @obligationKey, @status, @amountPaid, @paidDate, @notes, @updatedAt)
  `).run(row);

  return row;
}
