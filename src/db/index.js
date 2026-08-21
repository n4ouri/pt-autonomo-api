import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let db;

function resolveDbPath() {
  const configured = process.env.DATABASE_PATH || './data/autonomo.db';
  if (configured === ':memory:') return configured;
  const abs = path.resolve(configured);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  return abs;
}

export function getDb() {
  if (db) return db;

  db = new Database(resolveDbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nif TEXT,
      activityStartDate TEXT,
      regimeIVA TEXT NOT NULL DEFAULT 'isento',
      serviceType TEXT NOT NULL DEFAULT 'SERVICOS_PROFISSIONAIS',
      apiKeyHash TEXT NOT NULL,
      apiKeySalt TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      profileId TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      vatRate REAL NOT NULL DEFAULT 0,
      counterpartyNIF TEXT,
      description TEXT,
      isJustifiedExpense INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_profile_date
      ON transactions(profileId, date);

    CREATE TABLE IF NOT EXISTS obligation_status (
      id TEXT PRIMARY KEY,
      profileId TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      obligationKey TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
      amountPaid REAL,
      paidDate TEXT,
      notes TEXT,
      updatedAt TEXT NOT NULL,
      UNIQUE(profileId, obligationKey)
    );
  `);

  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = undefined;
  }
}
