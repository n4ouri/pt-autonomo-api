import crypto from 'crypto';
import { getDb } from './index.js';

export function createTransaction(profileId, input) {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const row = {
    id,
    profileId,
    type: input.type,
    date: input.date,
    amount: input.amount,
    category: input.category,
    vatRate: input.vatRate ?? 0,
    counterpartyNIF: input.counterpartyNIF ?? null,
    description: input.description ?? null,
    isJustifiedExpense: input.isJustifiedExpense ? 1 : 0,
    createdAt: now,
    updatedAt: now
  };

  db.prepare(`
    INSERT INTO transactions (id, profileId, type, date, amount, category, vatRate, counterpartyNIF, description, isJustifiedExpense, createdAt, updatedAt)
    VALUES (@id, @profileId, @type, @date, @amount, @category, @vatRate, @counterpartyNIF, @description, @isJustifiedExpense, @createdAt, @updatedAt)
  `).run(row);

  return getTransactionById(profileId, id);
}

export function getTransactionById(profileId, id) {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM transactions WHERE id = ? AND profileId = ?`).get(id, profileId);
  return row ? toPublicTransaction(row) : null;
}

export function listTransactions(profileId, { from, to, type, category } = {}) {
  const db = getDb();
  const clauses = ['profileId = @profileId'];
  const params = { profileId };

  if (from) { clauses.push('date >= @from'); params.from = from; }
  if (to) { clauses.push('date <= @to'); params.to = to; }
  if (type) { clauses.push('type = @type'); params.type = type; }
  if (category) { clauses.push('category = @category'); params.category = category; }

  const rows = db.prepare(`
    SELECT * FROM transactions WHERE ${clauses.join(' AND ')} ORDER BY date DESC, createdAt DESC
  `).all(params);

  return rows.map(toPublicTransaction);
}

export function updateTransaction(profileId, id, updates) {
  const db = getDb();
  const current = db.prepare(`SELECT * FROM transactions WHERE id = ? AND profileId = ?`).get(id, profileId);
  if (!current) return null;

  const merged = {
    id,
    profileId,
    type: updates.type ?? current.type,
    date: updates.date ?? current.date,
    amount: updates.amount ?? current.amount,
    category: updates.category ?? current.category,
    vatRate: updates.vatRate ?? current.vatRate,
    counterpartyNIF: updates.counterpartyNIF ?? current.counterpartyNIF,
    description: updates.description ?? current.description,
    isJustifiedExpense: (updates.isJustifiedExpense ?? current.isJustifiedExpense) ? 1 : 0,
    updatedAt: new Date().toISOString()
  };

  db.prepare(`
    UPDATE transactions SET type=@type, date=@date, amount=@amount, category=@category, vatRate=@vatRate,
      counterpartyNIF=@counterpartyNIF, description=@description, isJustifiedExpense=@isJustifiedExpense, updatedAt=@updatedAt
    WHERE id=@id AND profileId=@profileId
  `).run(merged);

  return getTransactionById(profileId, id);
}

export function deleteTransaction(profileId, id) {
  const db = getDb();
  const result = db.prepare(`DELETE FROM transactions WHERE id = ? AND profileId = ?`).run(id, profileId);
  return result.changes > 0;
}

function toPublicTransaction(row) {
  return { ...row, isJustifiedExpense: Boolean(row.isJustifiedExpense) };
}
