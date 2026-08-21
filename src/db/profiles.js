import crypto from 'crypto';
import { getDb } from './index.js';

function hashApiKey(apiKey, salt) {
  return crypto.scryptSync(apiKey, salt, 64).toString('hex');
}

export function createProfile({ name, nif, activityStartDate, regimeIVA, serviceType }) {
  const db = getDb();
  const id = crypto.randomUUID();
  const apiKey = `pta_${crypto.randomBytes(24).toString('hex')}`;
  const salt = crypto.randomBytes(16).toString('hex');
  const apiKeyHash = hashApiKey(apiKey, salt);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO profiles (id, name, nif, activityStartDate, regimeIVA, serviceType, apiKeyHash, apiKeySalt, createdAt, updatedAt)
    VALUES (@id, @name, @nif, @activityStartDate, @regimeIVA, @serviceType, @apiKeyHash, @apiKeySalt, @now, @now)
  `).run({ id, name, nif: nif ?? null, activityStartDate: activityStartDate ?? null, regimeIVA, serviceType, apiKeyHash, apiKeySalt: salt, now });

  return { profile: getProfileById(id), apiKey };
}

export function getProfileById(id) {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM profiles WHERE id = ?`).get(id);
  return row ? toPublicProfile(row) : null;
}

export function findProfileByApiKey(apiKey) {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM profiles`).all();
  for (const row of rows) {
    const candidateHash = hashApiKey(apiKey, row.apiKeySalt);
    if (crypto.timingSafeEqual(Buffer.from(candidateHash), Buffer.from(row.apiKeyHash))) {
      return toPublicProfile(row);
    }
  }
  return null;
}

export function updateProfile(id, updates) {
  const db = getDb();
  const current = db.prepare(`SELECT * FROM profiles WHERE id = ?`).get(id);
  if (!current) return null;

  const merged = {
    name: updates.name ?? current.name,
    nif: updates.nif ?? current.nif,
    activityStartDate: updates.activityStartDate ?? current.activityStartDate,
    regimeIVA: updates.regimeIVA ?? current.regimeIVA,
    serviceType: updates.serviceType ?? current.serviceType,
    updatedAt: new Date().toISOString(),
    id
  };

  db.prepare(`
    UPDATE profiles SET name = @name, nif = @nif, activityStartDate = @activityStartDate,
      regimeIVA = @regimeIVA, serviceType = @serviceType, updatedAt = @updatedAt
    WHERE id = @id
  `).run(merged);

  return getProfileById(id);
}

function toPublicProfile(row) {
  const { apiKeyHash, apiKeySalt, ...publicFields } = row;
  return publicFields;
}
