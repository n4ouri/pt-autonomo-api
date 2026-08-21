process.env.DATABASE_PATH = ':memory:';

import { test } from 'node:test';
import assert from 'node:assert';
import { createProfile } from '../src/db/profiles.js';
import { createTransaction } from '../src/db/transactions.js';
import { generateObligations } from '../src/engines/obligations-engine.js';

const REFERENCE_DATE = new Date('2026-06-01T00:00:00Z');

test('Obligations - a fresh trimestral profile with no ledger gets statutory-minimum SS items and IVA items', () => {
  const { profile } = createProfile({ name: 'Freela', nif: '111222333', regimeIVA: 'trimestral', serviceType: 'SERVICOS_PROFISSIONAIS' });

  const items = generateObligations(profile, REFERENCE_DATE);

  assert.ok(items.length > 0);
  assert.ok(items.every((i) => i.obligationKey && i.dueDate && i.calendarCode));
  assert.ok(items.every((i, idx) => idx === 0 || i.dueDate >= items[idx - 1].dueDate), 'items must be sorted by dueDate ascending');

  const ssQuarterlies = items.filter((i) => i.calendarCode.startsWith('SS_TRIMESTRAL'));
  assert.strictEqual(ssQuarterlies.length, 4);
  assert.ok(ssQuarterlies.every((i) => i.amountEstimated === null), 'no ledger data means no estimated amount, not a fabricated one');

  const ivaItems = items.filter((i) => i.calendarCode === 'IVA_TRIMESTRAL');
  assert.strictEqual(ivaItems.length, 4, 'a trimestral-regime profile gets all 4 quarterly VAT obligations');
});

test('Obligations - an isento profile never gets IVA_TRIMESTRAL obligations', () => {
  const { profile } = createProfile({ name: 'Isento', nif: '222333444', regimeIVA: 'isento', serviceType: 'SERVICOS_PROFISSIONAIS' });

  const items = generateObligations(profile, REFERENCE_DATE);

  assert.strictEqual(items.filter((i) => i.calendarCode === 'IVA_TRIMESTRAL').length, 0);
});

test('Obligations - Q1 ledger income feeds a real SS contribution estimate into the Q1 declaration', () => {
  const { profile } = createProfile({ name: 'ComLedger', nif: '333444555', regimeIVA: 'trimestral', serviceType: 'SERVICOS_PROFISSIONAIS' });
  createTransaction(profile.id, { type: 'income', date: '2026-02-10', amount: 5000, category: 'SERVICOS_PROFISSIONAIS', vatRate: 0.23 });

  // Before the 30 Apr due date so the still-upcoming Q1 declaration covers Q1 2026, matching the transaction above.
  const beforeQ1Deadline = new Date('2026-03-01T00:00:00Z');
  const items = generateObligations(profile, beforeQ1Deadline);
  const q1 = items.find((i) => i.calendarCode === 'SS_TRIMESTRAL_Q1');

  assert.ok(q1);
  assert.strictEqual(typeof q1.amountEstimated, 'number');
  assert.ok(q1.amountEstimated > 0);
  assert.ok(q1.note.includes('rendimento relevante'));
});

test('Obligations - a full prior year of high income requires PPC instalments in the projected timeline', () => {
  const { profile } = createProfile({ name: 'AltoRendimento', nif: '444555666', regimeIVA: 'trimestral', serviceType: 'SERVICOS_PROFISSIONAIS' });
  for (const month of [1, 4, 7, 10]) {
    createTransaction(profile.id, {
      type: 'income',
      date: `2025-${String(month).padStart(2, '0')}-15`,
      amount: 15000,
      category: 'SERVICOS_PROFISSIONAIS',
      vatRate: 0.23
    });
  }

  const referenceInJuly = new Date('2026-06-01T00:00:00Z');
  const items = generateObligations(profile, referenceInJuly);
  const ppcItems = items.filter((i) => i.calendarCode.startsWith('PPC_'));

  assert.strictEqual(ppcItems.length, 3, 'a 60000€ prior year triggers all 3 PPC instalments');
  assert.ok(ppcItems.every((i) => i.amountEstimated > 0));
});

test('Obligations - a low prior-year income does not require PPC instalments', () => {
  const { profile } = createProfile({ name: 'BaixoRendimento', nif: '555666777', regimeIVA: 'trimestral', serviceType: 'SERVICOS_PROFISSIONAIS' });
  createTransaction(profile.id, { type: 'income', date: '2025-03-15', amount: 500, category: 'SERVICOS_PROFISSIONAIS', vatRate: 0.23 });

  const items = generateObligations(profile, REFERENCE_DATE);
  assert.strictEqual(items.filter((i) => i.calendarCode.startsWith('PPC_')).length, 0);
});

test('Obligations - IRS Modelo 3 and e-Fatura validation deadlines always appear regardless of regime', () => {
  const { profile } = createProfile({ name: 'Sempre', nif: '666777888', regimeIVA: 'isento', serviceType: 'SERVICOS_PROFISSIONAIS' });

  const items = generateObligations(profile, REFERENCE_DATE);

  assert.ok(items.some((i) => i.calendarCode === 'IRS_MODELO_3'));
  assert.ok(items.some((i) => i.calendarCode === 'EFATURA_VALIDACAO'));
});
