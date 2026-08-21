import crypto from 'crypto';
import { getDb } from './index.js';

export function getConnectorStatus(profileId, provider) {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM connector_sessions WHERE profileId = ? AND provider = ?`).get(profileId, provider);
  return row ? toPublicSession(row) : null;
}

export function listConnectorStatuses(profileId) {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM connector_sessions WHERE profileId = ?`).all(profileId);
  return rows.map(toPublicSession);
}

export function upsertConnectorSession(profileId, provider, { cookieEnc, label }) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM connector_sessions WHERE profileId = ? AND provider = ?`).get(profileId, provider);
  const now = new Date().toISOString();

  if (existing) {
    const merged = {
      id: existing.id,
      cookieEnc,
      label: label ?? existing.label,
      capturedAt: now,
      updatedAt: now
    };
    db.prepare(`
      UPDATE connector_sessions SET cookieEnc=@cookieEnc, label=@label, capturedAt=@capturedAt, updatedAt=@updatedAt
      WHERE id=@id
    `).run(merged);
    return getConnectorStatus(profileId, provider);
  }

  const row = {
    id: crypto.randomUUID(),
    profileId,
    provider,
    cookieEnc,
    label: label ?? null,
    capturedAt: now,
    lastSyncedAt: null,
    lastSyncStatus: null,
    updatedAt: now
  };

  db.prepare(`
    INSERT INTO connector_sessions (id, profileId, provider, cookieEnc, label, capturedAt, lastSyncedAt, lastSyncStatus, updatedAt)
    VALUES (@id, @profileId, @provider, @cookieEnc, @label, @capturedAt, @lastSyncedAt, @lastSyncStatus, @updatedAt)
  `).run(row);

  return getConnectorStatus(profileId, provider);
}

/** Returns the raw (still-encrypted) row, for internal sync use only — never exposed via the public API shape. */
export function getConnectorSessionRaw(profileId, provider) {
  const db = getDb();
  return db.prepare(`SELECT * FROM connector_sessions WHERE profileId = ? AND provider = ?`).get(profileId, provider);
}

export function recordSyncResult(profileId, provider, status) {
  const db = getDb();
  db.prepare(`
    UPDATE connector_sessions SET lastSyncedAt = @now, lastSyncStatus = @status, updatedAt = @now
    WHERE profileId = @profileId AND provider = @provider
  `).run({ now: new Date().toISOString(), status, profileId, provider });
}

export function deleteConnectorSession(profileId, provider) {
  const db = getDb();
  const result = db.prepare(`DELETE FROM connector_sessions WHERE profileId = ? AND provider = ?`).run(profileId, provider);
  return result.changes > 0;
}

function toPublicSession(row) {
  const { cookieEnc, ...publicFields } = row;
  return publicFields;
}
